package com.snackbar.impressao.application.usecases;

import com.snackbar.impressao.application.dtos.ImprimirCupomRequest;
import com.snackbar.impressao.application.dtos.ImprimirCupomResponse;
import com.snackbar.impressao.application.ports.ConfiguracaoImpressoraRepositoryPort;
import com.snackbar.impressao.application.ports.ElectronGatewayException;
import com.snackbar.impressao.application.ports.ElectronGatewayPort;
import com.snackbar.impressao.application.ports.PedidoServicePort;
import com.snackbar.impressao.domain.entities.CupomFiscal;
import com.snackbar.impressao.domain.entities.TipoImpressora;
import com.snackbar.impressao.domain.ports.ImpressaoException;
import com.snackbar.impressao.domain.ports.ImpressoraPort;
import com.snackbar.impressao.domain.valueobjects.ConfiguracaoImpressora;
import com.snackbar.impressao.infrastructure.impressora.ConexaoImpressoraUtil;
import com.snackbar.impressao.infrastructure.impressora.ImpressoraFactory;
import lombok.extern.slf4j.Slf4j;
import com.snackbar.pedidos.application.dto.ItemPedidoDTO;
import com.snackbar.pedidos.application.dto.MeioPagamentoDTO;
import com.snackbar.pedidos.application.dto.PedidoDTO;
import com.snackbar.pedidos.domain.entities.MeioPagamento;
import com.snackbar.pedidos.domain.entities.StatusPedido;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ImprimirCupomFiscalUseCase {

    private static final String CHARSET_PADRAO_CUPOM = "UTF-8";

    private final PedidoServicePort pedidoService;
    private final ImpressoraFactory impressoraFactory;
    private final ConfiguracaoImpressoraRepositoryPort configuracaoRepository;
    private final ElectronGatewayPort electronGateway;

    public ImprimirCupomResponse executar(ImprimirCupomRequest request) {
        PedidoDTO pedido = buscarPedido(request.getPedidoId());
        ConfiguracaoImpressora configuracao = criarConfiguracao(request);
        CupomFiscal cupomFiscal = criarCupomFiscal(pedido, configuracao, request);

        String devicePath = configuracao.getDevicePath();
        boolean eImpressoraLocal = devicePath != null && !ConexaoImpressoraUtil.eConexaoRede(devicePath);

        // Tenta usar Electron Gateway primeiro se:
        // 1. Electron está disponível (só funciona se backend também estiver local)
        // 2. DevicePath foi fornecido
        // NOTA: Se backend estiver online, Electron não estará disponível e usará
        // impressão direta
        if (electronGateway.estaDisponivel() && devicePath != null) {
            try {
                boolean sucesso = electronGateway.enviarComandoImpressao(cupomFiscal, devicePath);
                if (sucesso) {
                    return ImprimirCupomResponse.builder()
                            .sucesso(true)
                            .mensagem("Cupom fiscal impresso com sucesso via Electron")
                            .dataImpressao(LocalDateTime.now())
                            .pedidoId(pedido.getId())
                            .build();
                }
            } catch (ElectronGatewayException e) {
                log.warn("Erro ao usar Electron Gateway, tentando impressão direta: {}", e.getMessage());
                // Continua para impressão direta como fallback
            }
        }

        // Fallback: Impressão direta
        // Funciona para:
        // - Impressoras de rede (IP:PORTA) - backend online pode imprimir
        // - Backend local com impressoras locais
        try {
            // Se for impressora local e backend está online, não consegue imprimir
            // diretamente
            if (eImpressoraLocal && !electronGateway.estaDisponivel()) {
                String mensagemErro = "Impressora local não acessível. " +
                        "Para impressão local com backend online, é necessário usar o Electron. " +
                        "Alternativamente, configure uma impressora de rede (IP:PORTA).";
                return ImprimirCupomResponse.builder()
                        .sucesso(false)
                        .mensagem("Erro ao imprimir cupom: " + mensagemErro)
                        .dataImpressao(LocalDateTime.now())
                        .pedidoId(pedido.getId())
                        .build();
            }

            ImpressoraPort impressora = impressoraFactory.criar(configuracao.getTipoImpressora());
            impressora.imprimir(cupomFiscal);

            return ImprimirCupomResponse.builder()
                    .sucesso(true)
                    .mensagem("Cupom fiscal impresso com sucesso")
                    .dataImpressao(LocalDateTime.now())
                    .pedidoId(pedido.getId())
                    .build();
        } catch (ImpressaoException e) {
            String mensagemErro = e.getMessage();
            if (eImpressoraLocal && !electronGateway.estaDisponivel()) {
                mensagemErro += " (Dica: Para impressão local com backend online, inicie o Electron. " +
                        "Ou configure uma impressora de rede: IP:PORTA)";
            }

            return ImprimirCupomResponse.builder()
                    .sucesso(false)
                    .mensagem("Erro ao imprimir cupom: " + mensagemErro)
                    .dataImpressao(LocalDateTime.now())
                    .pedidoId(pedido.getId())
                    .build();
        }
    }

    private PedidoDTO buscarPedido(String pedidoId) {
        if ("teste".equalsIgnoreCase(pedidoId)) {
            return criarPedidoTeste();
        }

        PedidoDTO pedido = pedidoService.buscarPedidoPorId(pedidoId);
        if (pedido == null) {
            throw new IllegalArgumentException("Pedido não encontrado: " + pedidoId);
        }
        return pedido;
    }

    private PedidoDTO criarPedidoTeste() {
        List<ItemPedidoDTO> itens = new ArrayList<>();
        itens.add(ItemPedidoDTO.builder()
                .produtoId("teste-1")
                .produtoNome("Hambúrguer Artesanal")
                .quantidade(2)
                .precoUnitario(new BigDecimal("25.00"))
                .subtotal(new BigDecimal("50.00"))
                .observacoes("Sem cebola")
                .build());
        itens.add(ItemPedidoDTO.builder()
                .produtoId("teste-2")
                .produtoNome("Batata Frita")
                .quantidade(1)
                .precoUnitario(new BigDecimal("12.00"))
                .subtotal(new BigDecimal("12.00"))
                .build());
        itens.add(ItemPedidoDTO.builder()
                .produtoId("teste-3")
                .produtoNome("Refrigerante")
                .quantidade(2)
                .precoUnitario(new BigDecimal("5.00"))
                .subtotal(new BigDecimal("10.00"))
                .build());

        List<MeioPagamentoDTO> meiosPagamento = new ArrayList<>();
        meiosPagamento.add(MeioPagamentoDTO.builder()
                .meioPagamento(MeioPagamento.PIX)
                .valor(new BigDecimal("50.00"))
                .build());
        meiosPagamento.add(MeioPagamentoDTO.builder()
                .meioPagamento(MeioPagamento.DINHEIRO)
                .valor(new BigDecimal("22.00"))
                .build());

        return PedidoDTO.builder()
                .id("teste")
                .numeroPedido("TESTE-001")
                .clienteId("teste-cliente")
                .clienteNome("Cliente de Teste")
                .status(StatusPedido.FINALIZADO)
                .itens(itens)
                .valorTotal(new BigDecimal("72.00"))
                .observacoes("Pedido de teste para impressão")
                .meiosPagamento(meiosPagamento)
                .usuarioId("teste-usuario")
                .dataPedido(LocalDateTime.now())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    private ConfiguracaoImpressora criarConfiguracao(ImprimirCupomRequest request) {
        String nomeImpressora = request.getNomeImpressora() != null
                ? request.getNomeImpressora()
                : request.getTipoImpressora().getDescricao();

        // Se devicePath foi fornecido no request, usa ele. Caso contrário, busca do
        // banco
        String devicePath = request.getDevicePath() != null && !request.getDevicePath().trim().isEmpty()
                ? request.getDevicePath()
                : obterDevicePathDoBanco(request.getTipoImpressora());

        if (request.getTipoImpressora() == TipoImpressora.EPSON_TM_T20) {
            return devicePath != null
                    ? ConfiguracaoImpressora.criar(TipoImpressora.EPSON_TM_T20, "EPSON TM-T20", devicePath, 80,
                            CHARSET_PADRAO_CUPOM)
                    : ConfiguracaoImpressora.padraoEpson();
        } else if (request.getTipoImpressora() == TipoImpressora.DARUMA_800) {
            return devicePath != null
                    ? ConfiguracaoImpressora.criar(TipoImpressora.DARUMA_800, "DARUMA DR-800", devicePath, 80,
                            CHARSET_PADRAO_CUPOM)
                    : ConfiguracaoImpressora.padraoDaruma();
        } else {
            return ConfiguracaoImpressora.criar(
                    request.getTipoImpressora(),
                    nomeImpressora,
                    devicePath,
                    80,
                    CHARSET_PADRAO_CUPOM);
        }
    }

    private String obterDevicePathDoBanco(TipoImpressora tipoImpressora) {
        var configSalva = configuracaoRepository.buscarAtiva();
        if (configSalva.isPresent() && configSalva.get().getTipoImpressora() == tipoImpressora) {
            return configSalva.get().getDevicePath();
        }
        return null;
    }

    private CupomFiscal criarCupomFiscal(PedidoDTO pedido, ConfiguracaoImpressora configuracao,
            ImprimirCupomRequest request) {
        String nomeEstabelecimento = request.getNomeEstabelecimento() != null
                ? request.getNomeEstabelecimento()
                : "experimenta-ai-do-soneca";

        String logoBase64 = null;
        byte[] logoEscPos = null;

        var configSalva = configuracaoRepository.buscarAtiva();
        if (configSalva.isPresent()) {
            var config = configSalva.get();
            logoBase64 = config.getLogoBase64();
            logoEscPos = config.getLogoEscPos();
        }

        return CupomFiscal.criar(
                pedido,
                configuracao,
                nomeEstabelecimento,
                request.getEnderecoEstabelecimento(),
                request.getTelefoneEstabelecimento(),
                request.getCnpjEstabelecimento(),
                logoBase64,
                logoEscPos);
    }
}
