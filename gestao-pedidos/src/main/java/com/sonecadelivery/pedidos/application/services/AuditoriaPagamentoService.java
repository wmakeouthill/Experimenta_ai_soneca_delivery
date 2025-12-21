package com.sonecadelivery.pedidos.application.services;

import com.sonecadelivery.pedidos.domain.entities.MeioPagamentoPedido;
import com.sonecadelivery.pedidos.domain.entities.Pedido;
import com.sonecadelivery.pedidos.infrastructure.persistence.AuditoriaPagamentoEntity;
import com.sonecadelivery.pedidos.infrastructure.persistence.AuditoriaPagamentoEntity.TipoOperacaoPagamento;
import com.sonecadelivery.pedidos.infrastructure.persistence.AuditoriaPagamentoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

/**
 * Serviço de auditoria para operações de pagamento.
 * 
 * Registra todas as operações relacionadas a pagamentos de pedidos,
 * permitindo rastreabilidade completa e análise de problemas.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuditoriaPagamentoService {

    private final AuditoriaPagamentoRepository auditoriaRepository;

    /**
     * Contexto da requisição atual (opcional).
     * Pode ser injetado via RequestScope ou passado explicitamente.
     */
    public record ContextoRequisicao(
            String ipOrigem,
            String userAgent,
            String idempotencyKey,
            String usuarioId,
            String sessaoTrabalhoId) {
        public static ContextoRequisicao vazio() {
            return new ContextoRequisicao(null, null, null, null, null);
        }
    }

    /**
     * Registra pagamento no momento da criação do pedido.
     */
    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void registrarPagamentoCriacaoPedido(Pedido pedido, ContextoRequisicao contexto) {
        registrarPagamentos(pedido, TipoOperacaoPagamento.PAGAMENTO_CRIACAO_PEDIDO, contexto);
    }

    /**
     * Registra pagamento posterior (ex: pedido de mesa sem pagamento inicial).
     */
    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void registrarPagamentoPosterior(Pedido pedido, ContextoRequisicao contexto) {
        registrarPagamentos(pedido, TipoOperacaoPagamento.PAGAMENTO_POSTERIOR, contexto);
    }

    /**
     * Registra pagamento via auto-atendimento (totem).
     */
    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void registrarPagamentoAutoatendimento(Pedido pedido, ContextoRequisicao contexto) {
        registrarPagamentos(pedido, TipoOperacaoPagamento.PAGAMENTO_AUTOATENDIMENTO, contexto);
    }

    /**
     * Registra pagamento via pedido de mesa (QR code).
     */
    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void registrarPagamentoMesa(Pedido pedido, ContextoRequisicao contexto) {
        registrarPagamentos(pedido, TipoOperacaoPagamento.PAGAMENTO_MESA, contexto);
    }

    /**
     * Registra tentativa de pagamento que foi rejeitada.
     */
    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void registrarPagamentoRejeitado(
            String pedidoId,
            String numeroPedido,
            String statusPedido,
            String meioPagamento,
            BigDecimal valor,
            BigDecimal valorTotalPedido,
            String mensagemErro,
            ContextoRequisicao contexto) {

        AuditoriaPagamentoEntity auditoria = AuditoriaPagamentoEntity.builder()
                .pedidoId(pedidoId)
                .numeroPedido(numeroPedido)
                .tipoOperacao(TipoOperacaoPagamento.PAGAMENTO_REJEITADO)
                .meioPagamento(meioPagamento)
                .valor(valor)
                .valorTotalPedido(valorTotalPedido)
                .statusPedido(statusPedido)
                .usuarioId(contexto.usuarioId())
                .sessaoTrabalhoId(contexto.sessaoTrabalhoId())
                .ipOrigem(contexto.ipOrigem())
                .userAgent(contexto.userAgent())
                .idempotencyKey(contexto.idempotencyKey())
                .sucesso(false)
                .mensagemErro(mensagemErro)
                .build();

        auditoriaRepository.save(auditoria);

        log.warn("[AUDITORIA_PAGAMENTO] Pagamento REJEITADO - Pedido: {}, Motivo: {}",
                numeroPedido, mensagemErro);
    }

    /**
     * Método interno para registrar todos os meios de pagamento de um pedido.
     */
    private void registrarPagamentos(Pedido pedido, TipoOperacaoPagamento tipoOperacao, ContextoRequisicao contexto) {
        List<MeioPagamentoPedido> meiosPagamento = pedido.getMeiosPagamento();

        if (meiosPagamento == null || meiosPagamento.isEmpty()) {
            log.debug("[AUDITORIA_PAGAMENTO] Pedido {} sem meios de pagamento para auditar",
                    pedido.getNumeroPedido().getNumero());
            return;
        }

        BigDecimal valorTotalPedido = pedido.getValorTotal().getAmount();
        String clienteId = pedido.getClienteId();

        for (MeioPagamentoPedido meioPagamento : meiosPagamento) {
            AuditoriaPagamentoEntity auditoria = AuditoriaPagamentoEntity.builder()
                    .pedidoId(pedido.getId())
                    .numeroPedido(pedido.getNumeroPedido().getNumero())
                    .tipoOperacao(tipoOperacao)
                    .meioPagamento(meioPagamento.getMeioPagamento().name())
                    .valor(meioPagamento.getValor().getAmount())
                    .valorTotalPedido(valorTotalPedido)
                    .statusPedido(pedido.getStatus().name())
                    .usuarioId(contexto.usuarioId())
                    .clienteId(clienteId)
                    .sessaoTrabalhoId(contexto.sessaoTrabalhoId())
                    .ipOrigem(contexto.ipOrigem())
                    .userAgent(contexto.userAgent())
                    .idempotencyKey(contexto.idempotencyKey())
                    .sucesso(true)
                    .build();

            auditoriaRepository.save(auditoria);
        }

        log.info("[AUDITORIA_PAGAMENTO] {} registrado - Pedido: {}, Valor: R$ {}, Meios: {}",
                tipoOperacao,
                pedido.getNumeroPedido().getNumero(),
                valorTotalPedido,
                meiosPagamento.size());
    }

    /**
     * Busca histórico de auditoria por pedido.
     */
    public List<AuditoriaPagamentoEntity> buscarPorPedido(String pedidoId) {
        return auditoriaRepository.findByPedidoIdOrderByDataHoraDesc(pedidoId);
    }

    /**
     * Busca histórico de auditoria por número do pedido.
     */
    public List<AuditoriaPagamentoEntity> buscarPorNumeroPedido(String numeroPedido) {
        return auditoriaRepository.findByNumeroPedidoOrderByDataHoraDesc(numeroPedido);
    }
}
