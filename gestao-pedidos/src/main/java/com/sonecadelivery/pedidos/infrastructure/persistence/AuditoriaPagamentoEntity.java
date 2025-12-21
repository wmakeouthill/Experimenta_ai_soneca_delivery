package com.sonecadelivery.pedidos.infrastructure.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entidade para auditoria de operações de pagamento.
 * 
 * Registra todas as operações relacionadas a pagamentos de pedidos,
 * incluindo criação, atualização e tentativas falhas.
 */
@Entity
@Table(name = "auditoria_pagamentos")
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditoriaPagamentoEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "pedido_id", nullable = false)
    private String pedidoId;

    @Column(name = "numero_pedido", nullable = false)
    private String numeroPedido;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_operacao", nullable = false)
    private TipoOperacaoPagamento tipoOperacao;

    @Column(name = "meio_pagamento", nullable = false)
    private String meioPagamento;

    @Column(name = "valor", nullable = false, precision = 10, scale = 2)
    private BigDecimal valor;

    @Column(name = "valor_total_pedido", nullable = false, precision = 10, scale = 2)
    private BigDecimal valorTotalPedido;

    @Column(name = "status_pedido", nullable = false)
    private String statusPedido;

    @Column(name = "usuario_id")
    private String usuarioId;

    @Column(name = "cliente_id")
    private String clienteId;

    @Column(name = "sessao_trabalho_id")
    private String sessaoTrabalhoId;

    @Column(name = "ip_origem")
    private String ipOrigem;

    @Column(name = "user_agent", length = 500)
    private String userAgent;

    @Column(name = "idempotency_key")
    private String idempotencyKey;

    @Column(name = "sucesso", nullable = false)
    @Builder.Default
    private Boolean sucesso = true;

    @Column(name = "mensagem_erro", columnDefinition = "TEXT")
    private String mensagemErro;

    @Column(name = "data_hora", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime dataHora = LocalDateTime.now();

    /**
     * Tipos de operação de pagamento para auditoria.
     */
    public enum TipoOperacaoPagamento {
        /** Pagamento registrado junto com a criação do pedido */
        PAGAMENTO_CRIACAO_PEDIDO,

        /** Pagamento registrado posteriormente (ex: pedido de mesa) */
        PAGAMENTO_POSTERIOR,

        /** Pagamento registrado via auto-atendimento (totem) */
        PAGAMENTO_AUTOATENDIMENTO,

        /** Pagamento registrado via pedido de mesa (QR code) */
        PAGAMENTO_MESA,

        /** Tentativa de pagamento que falhou por validação */
        PAGAMENTO_REJEITADO,

        /** Estorno ou cancelamento de pagamento */
        PAGAMENTO_ESTORNADO
    }
}
