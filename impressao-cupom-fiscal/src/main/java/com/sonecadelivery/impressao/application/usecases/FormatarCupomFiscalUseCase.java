package com.sonecadelivery.impressao.application.usecases;

import com.sonecadelivery.impressao.application.dtos.FormatarCupomResponse;
import com.sonecadelivery.impressao.application.dtos.ImprimirCupomRequest;
import com.sonecadelivery.impressao.application.ports.ConfiguracaoImpressoraRepositoryPort;
import com.sonecadelivery.impressao.application.ports.PedidoServicePort;
import com.sonecadelivery.impressao.domain.entities.CupomFiscal;
import com.sonecadelivery.impressao.domain.entities.TipoImpressora;
import com.sonecadelivery.impressao.domain.valueobjects.ConfiguracaoImpressora;
import com.sonecadelivery.impressao.infrastructure.impressora.FormatoCupomFiscal;
import com.sonecadelivery.pedidos.application.dto.ItemPedidoDTO;
import com.sonecadelivery.pedidos.application.dto.MeioPagamentoDTO;
import com.sonecadelivery.pedidos.application.dto.PedidoDTO;
import com.sonecadelivery.pedidos.domain.entities.MeioPagamento;
import com.sonecadelivery.pedidos.domain.entities.StatusPedido;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;

/**
 * Use Case para formatar cupom fiscal sem tentar imprimir
 * Retorna os dados formatados em ESC/POS (base64) para impressão posterior
 * Útil quando o frontend está no Electron e precisa imprimir localmente
 */
@Service
@RequiredArgsConstructor
public class FormatarCupomFiscalUseCase {

        private static final String CHARSET_PADRAO_CUPOM = "UTF-8";
        private final PedidoServicePort pedidoService;
        private final ConfiguracaoImpressoraRepositoryPort configuracaoRepository;

        public FormatarCupomResponse executar(ImprimirCupomRequest request) {
                PedidoDTO pedido = buscarPedido(request.getPedidoId());
                ConfiguracaoImpressora configuracao = criarConfiguracao(request);
                CupomFiscal cupomFiscal = criarCupomFiscal(pedido, configuracao, request);

                // Formata o cupom em ESC/POS
                byte[] dadosEscPos = FormatoCupomFiscal.formatarCupom(cupomFiscal);

                // Codifica em base64 para envio via HTTP
                String dadosEscPosBase64 = Base64.getEncoder().encodeToString(dadosEscPos);

                // Logo base64 é passado separadamente para o Electron
                // O Electron usa node-thermal-printer para converter e imprimir o logo
                String logoBase64 = cupomFiscal.getLogoBase64();

                return FormatarCupomResponse.builder()
                                .sucesso(true)
                                .mensagem("Cupom formatado com sucesso")
                                .dadosEscPosBase64(dadosEscPosBase64)
                                .logoBase64(logoBase64)
                                .tipoImpressora(configuracao.getTipoImpressora().name())
                                .pedidoId(pedido.getId())
                                .build();
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

                // Se devicePath veio no request, prioriza ele (útil para testes)
                // Caso contrário, busca do banco
                String devicePath = request.getDevicePath() != null && !request.getDevicePath().trim().isEmpty()
                                ? request.getDevicePath()
                                : obterDevicePathDoBanco();

                int larguraPapel = obterLarguraPapelConfiguradaOuPadrao();

                if (request.getTipoImpressora() == TipoImpressora.EPSON_TM_T20) {
                        return devicePath != null
                                        ? ConfiguracaoImpressora.criar(TipoImpressora.EPSON_TM_T20, "EPSON TM-T20",
                                                        devicePath,
                                                        larguraPapel, CHARSET_PADRAO_CUPOM)
                                        : ConfiguracaoImpressora.padraoEpson();
                } else if (request.getTipoImpressora() == TipoImpressora.DARUMA_800) {
                        return devicePath != null
                                        ? ConfiguracaoImpressora.criar(TipoImpressora.DARUMA_800, "DARUMA DR-800",
                                                        devicePath, larguraPapel,
                                                        CHARSET_PADRAO_CUPOM)
                                        : ConfiguracaoImpressora.padraoDaruma();
                } else {
                        return ConfiguracaoImpressora.criar(
                                        request.getTipoImpressora(),
                                        nomeImpressora,
                                        devicePath,
                                        larguraPapel,
                                        CHARSET_PADRAO_CUPOM);
                }
        }

        private int obterLarguraPapelConfiguradaOuPadrao() {
                var configSalva = configuracaoRepository.buscarAtiva();
                if (configSalva.isPresent() && configSalva.get().getLarguraPapel() != null
                                && configSalva.get().getLarguraPapel() > 0) {
                        return configSalva.get().getLarguraPapel();
                }
                return 80;
        }

        private String obterDevicePathDoBanco() {
                var configSalva = configuracaoRepository.buscarAtiva();
                if (configSalva.isPresent()) {
                        return configSalva.get().getDevicePath();
                }
                return null;
        }

        private CupomFiscal criarCupomFiscal(PedidoDTO pedido, ConfiguracaoImpressora configuracao,
                        ImprimirCupomRequest request) {
                // Busca nome do estabelecimento da configuração salva se não vier no request
                String nomeEstabelecimento = request.getNomeEstabelecimento();
                if (nomeEstabelecimento == null || nomeEstabelecimento.trim().isEmpty()) {
                        var configSalva = configuracaoRepository.buscarAtiva();
                        if (configSalva.isPresent() && configSalva.get().getNomeEstabelecimento() != null) {
                                nomeEstabelecimento = configSalva.get().getNomeEstabelecimento();
                        } else {
                                nomeEstabelecimento = "Experimenta ai do Soneca";
                        }
                }

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
