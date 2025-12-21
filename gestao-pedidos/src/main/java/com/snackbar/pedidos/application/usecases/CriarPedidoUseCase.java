package com.snackbar.pedidos.application.usecases;

import com.snackbar.cardapio.domain.valueobjects.Preco;
import com.snackbar.pedidos.application.dto.CriarPedidoRequest;
import com.snackbar.pedidos.application.dto.ItemPedidoAdicionalRequest;
import com.snackbar.pedidos.application.dto.ItemPedidoRequest;
import com.snackbar.pedidos.application.dto.MeioPagamentoRequest;
import com.snackbar.pedidos.application.dto.PedidoDTO;
import com.snackbar.pedidos.application.ports.CardapioServicePort;
import com.snackbar.pedidos.application.ports.PedidoRepositoryPort;
import com.snackbar.pedidos.application.ports.SessaoTrabalhoRepositoryPort;
import com.snackbar.pedidos.application.services.AuditoriaPagamentoService;
import com.snackbar.pedidos.application.services.AuditoriaPagamentoService.ContextoRequisicao;
import com.snackbar.pedidos.application.services.GeradorNumeroPedidoService;
import com.snackbar.pedidos.domain.entities.ItemPedido;
import com.snackbar.pedidos.domain.entities.ItemPedidoAdicional;
import com.snackbar.pedidos.domain.entities.MeioPagamentoPedido;
import com.snackbar.pedidos.domain.entities.Pedido;
import com.snackbar.pedidos.domain.services.PedidoValidator;
import com.snackbar.pedidos.domain.valueobjects.NumeroPedido;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/**
 * Use case para criação de pedidos com tratamento de concorrência.
 * 
 * Implementa retry automático em caso de conflito de número de pedido,
 * garantindo que pedidos concorrentes não falhem por duplicação.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CriarPedidoUseCase {

    private final PedidoRepositoryPort pedidoRepository;
    private final CardapioServicePort cardapioService;
    private final PedidoValidator pedidoValidator;
    private final SessaoTrabalhoRepositoryPort sessaoTrabalhoRepository;
    private final GeradorNumeroPedidoService geradorNumeroPedido;
    private final AuditoriaPagamentoService auditoriaPagamentoService;

    private static final int MAX_TENTATIVAS_CONCORRENCIA = 3;

    @Transactional
    public PedidoDTO executar(CriarPedidoRequest request, @Nullable ContextoRequisicao contexto) {
        if (contexto == null) {
            contexto = ContextoRequisicao.vazio();
        }

        int tentativas = 0;
        DataIntegrityViolationException ultimaExcecao = null;

        while (tentativas < MAX_TENTATIVAS_CONCORRENCIA) {
            tentativas++;

            try {
                return executarCriacao(request, contexto);
            } catch (DataIntegrityViolationException e) {
                // Com a nova sequence, este cenário é muito improvável
                log.warn("Conflito de integridade detectado (tentativa {}), tentando novamente...", tentativas);
                ultimaExcecao = e;
            }
        }

        log.error("Falha ao criar pedido após {} tentativas por conflito de integridade",
                MAX_TENTATIVAS_CONCORRENCIA);
        throw new IllegalStateException(
                "Não foi possível criar o pedido após " + MAX_TENTATIVAS_CONCORRENCIA +
                        " tentativas devido a alta concorrência",
                ultimaExcecao);
    }

    /**
     * Método de compatibilidade para chamadas sem contexto.
     */
    @Transactional
    public PedidoDTO executar(CriarPedidoRequest request) {
        return executar(request, null);
    }

    private PedidoDTO executarCriacao(CriarPedidoRequest request, ContextoRequisicao contexto) {
        NumeroPedido numeroPedido = geradorNumeroPedido.gerarProximoNumero();

        Pedido pedido = Pedido.criar(
                numeroPedido,
                request.getClienteId(),
                request.getClienteNome(),
                request.getUsuarioId());

        for (ItemPedidoRequest itemRequest : request.getItens()) {
            validarProdutoDisponivel(itemRequest.getProdutoId());

            var produtoDTO = cardapioService.buscarProdutoPorId(itemRequest.getProdutoId());
            Preco precoUnitario = Preco.of(produtoDTO.getPreco());

            // Processar adicionais do item
            List<ItemPedidoAdicional> adicionais = processarAdicionais(itemRequest.getAdicionais());

            ItemPedido item = ItemPedido.criar(
                    itemRequest.getProdutoId(),
                    produtoDTO.getNome(),
                    itemRequest.getQuantidade(),
                    precoUnitario,
                    itemRequest.getObservacoes(),
                    adicionais);

            pedido.adicionarItem(item);
        }

        pedido.atualizarObservacoes(request.getObservacoes());

        for (MeioPagamentoRequest meioPagamentoRequest : request.getMeiosPagamento()) {
            Preco valor = Preco.of(meioPagamentoRequest.getValor());
            MeioPagamentoPedido meioPagamentoPedido = MeioPagamentoPedido.criar(
                    meioPagamentoRequest.getMeioPagamento(),
                    valor);
            pedido.adicionarMeioPagamento(meioPagamentoPedido);
        }

        validarTotalMeiosPagamento(pedido);
        pedidoValidator.validarCriacao(pedido);

        vincularSessaoAtiva(pedido);

        Pedido pedidoSalvo = pedidoRepository.salvar(pedido);

        // Registra auditoria do pagamento (assíncrono)
        if (!pedidoSalvo.getMeiosPagamento().isEmpty()) {
            auditoriaPagamentoService.registrarPagamentoCriacaoPedido(pedidoSalvo, contexto);
        }

        return PedidoDTO.de(pedidoSalvo);
    }

    private void vincularSessaoAtiva(Pedido pedido) {
        sessaoTrabalhoRepository.buscarSessaoAtiva()
                .ifPresentOrElse(
                        sessao -> {
                            pedido.definirSessaoId(sessao.getId());
                            log.info("[PEDIDO] Pedido vinculado à sessão ativa: {}", sessao.getId());
                        },
                        () -> log.warn("[PEDIDO] Nenhuma sessão ativa encontrada! Pedido será criado sem sessão."));
    }

    private void validarProdutoDisponivel(String produtoId) {
        if (!cardapioService.produtoEstaDisponivel(produtoId)) {
            throw new com.snackbar.kernel.domain.exceptions.ValidationException(
                    "Produto não está disponível: " + produtoId);
        }
    }

    private void validarTotalMeiosPagamento(Pedido pedido) {
        Preco totalMeiosPagamento = pedido.calcularTotalMeiosPagamento();
        if (!totalMeiosPagamento.equals(pedido.getValorTotal())) {
            throw new com.snackbar.kernel.domain.exceptions.ValidationException(
                    String.format(
                            "A soma dos meios de pagamento (R$ %.2f) deve ser igual ao valor total do pedido (R$ %.2f)",
                            totalMeiosPagamento.getAmount().doubleValue(),
                            pedido.getValorTotal().getAmount().doubleValue()));
        }
    }

    /**
     * Processa a lista de adicionais do request, validando e buscando informações
     * completas.
     */
    private List<ItemPedidoAdicional> processarAdicionais(List<ItemPedidoAdicionalRequest> adicionaisRequest) {
        if (adicionaisRequest == null || adicionaisRequest.isEmpty()) {
            return new ArrayList<>();
        }

        List<ItemPedidoAdicional> adicionais = new ArrayList<>();
        for (ItemPedidoAdicionalRequest adicionalRequest : adicionaisRequest) {
            validarAdicionalDisponivel(adicionalRequest.getAdicionalId());

            var adicionalDTO = cardapioService.buscarAdicionalPorId(adicionalRequest.getAdicionalId());
            Preco precoUnitario = Preco.of(adicionalDTO.getPreco());

            ItemPedidoAdicional adicional = ItemPedidoAdicional.criar(
                    adicionalRequest.getAdicionalId(),
                    adicionalDTO.getNome(),
                    adicionalRequest.getQuantidade(),
                    precoUnitario);

            adicionais.add(adicional);
        }
        return adicionais;
    }

    private void validarAdicionalDisponivel(String adicionalId) {
        if (!cardapioService.adicionalEstaDisponivel(adicionalId)) {
            throw new com.snackbar.kernel.domain.exceptions.ValidationException(
                    "Adicional não está disponível: " + adicionalId);
        }
    }
}
