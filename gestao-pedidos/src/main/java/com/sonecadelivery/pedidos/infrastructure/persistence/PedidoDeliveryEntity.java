package com.sonecadelivery.pedidos.infrastructure.persistence;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Entidade JPA para pedidos de delivery.
 * Separada da tabela de pedidos balcão/mesa para maior flexibilidade.
 */
@Entity
@Table(name = "pedidos_delivery", indexes = {
        @Index(name = "idx_pedidos_delivery_cliente", columnList = "cliente_id"),
        @Index(name = "idx_pedidos_delivery_telefone", columnList = "telefone_cliente"),
        @Index(name = "idx_pedidos_delivery_status", columnList = "status"),
        @Index(name = "idx_pedidos_delivery_created", columnList = "created_at"),
        @Index(name = "idx_pedidos_delivery_motoboy", columnList = "motoboy_id"),
        @Index(name = "idx_pedidos_delivery_motoboy_status", columnList = "motoboy_id,status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PedidoDeliveryEntity {

    @Id
    @Column(length = 36)
    private String id;

    @Column(name = "numero_pedido", length = 20, nullable = false)
    private String numeroPedido;

    @Column(name = "idempotency_key", length = 100, unique = true)
    private String idempotencyKey;

    // ===== Cliente =====
    @Column(name = "cliente_id", length = 36)
    private String clienteId;

    @Column(name = "nome_cliente", length = 200, nullable = false)
    private String nomeCliente;

    @Column(name = "telefone_cliente", length = 20, nullable = false)
    private String telefoneCliente;

    @Column(name = "email_cliente", length = 255)
    private String emailCliente;

    // ===== Endereço =====
    @Column(name = "endereco_entrega", columnDefinition = "TEXT")
    private String enderecoEntrega;

    @Column(length = 255)
    private String logradouro;

    @Column(length = 20)
    private String numero;

    @Column(length = 100)
    private String complemento;

    @Column(length = 100)
    private String bairro;

    @Column(length = 100)
    private String cidade;

    @Column(length = 2)
    private String estado;

    @Column(length = 10)
    private String cep;

    @Column(name = "ponto_referencia", length = 255)
    private String pontoReferencia;

    // ===== Tipo e Status =====
    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_pedido", nullable = false)
    @Builder.Default
    private TipoPedidoDelivery tipoPedido = TipoPedidoDelivery.DELIVERY;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private StatusPedidoDelivery status = StatusPedidoDelivery.AGUARDANDO_ACEITACAO;

    // ===== Motoboy =====
    @Column(name = "motoboy_id", length = 36)
    private String motoboyId;

    @Column(name = "motoboy_nome", length = 200)
    private String motoboyNome;

    // ===== Valores =====
    @Column(name = "valor_itens", precision = 10, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal valorItens = BigDecimal.ZERO;

    @Column(name = "valor_adicionais", precision = 10, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal valorAdicionais = BigDecimal.ZERO;

    @Column(name = "taxa_entrega", precision = 10, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal taxaEntrega = BigDecimal.ZERO;

    @Column(name = "valor_motoboy", precision = 10, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal valorMotoboy = new BigDecimal("5.00");

    @Column(name = "valor_desconto", precision = 10, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal valorDesconto = BigDecimal.ZERO;

    @Column(name = "valor_total", precision = 10, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal valorTotal = BigDecimal.ZERO;

    // ===== Pagamento =====
    @Column(name = "meio_pagamento", length = 50)
    private String meioPagamento;

    @Column(name = "valor_pago", precision = 10, scale = 2)
    private BigDecimal valorPago;

    @Column(name = "troco_para", precision = 10, scale = 2)
    private BigDecimal trocoPara;

    // ===== Observações =====
    @Column(columnDefinition = "TEXT")
    private String observacoes;

    // ===== Previsões =====
    @Column(name = "previsao_entrega")
    private LocalDateTime previsaoEntrega;

    // ===== Timestamps =====
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "aceito_at")
    private LocalDateTime aceitoAt;

    @Column(name = "preparando_at")
    private LocalDateTime preparandoAt;

    @Column(name = "pronto_at")
    private LocalDateTime prontoAt;

    @Column(name = "saiu_entrega_at")
    private LocalDateTime saiuEntregaAt;

    @Column(name = "entregue_at")
    private LocalDateTime entregueAt;

    @Column(name = "cancelado_at")
    private LocalDateTime canceladoAt;

    // ===== Relacionamentos =====
    @OneToMany(mappedBy = "pedidoDelivery", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<ItemPedidoDeliveryEntity> itens = new ArrayList<>();

    @OneToMany(mappedBy = "pedidoDelivery", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<MeioPagamentoPedidoDeliveryEntity> meiosPagamento = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public void adicionarItem(ItemPedidoDeliveryEntity item) {
        itens.add(item);
        item.setPedidoDelivery(this);
    }

    public void adicionarMeioPagamento(MeioPagamentoPedidoDeliveryEntity meioPagamento) {
        meiosPagamento.add(meioPagamento);
        meioPagamento.setPedidoDelivery(this);
    }

    // ===== Enums =====
    public enum TipoPedidoDelivery {
        DELIVERY, RETIRADA
    }

    public enum StatusPedidoDelivery {
        AGUARDANDO_ACEITACAO,
        ACEITO,
        PREPARANDO,
        PRONTO,
        SAIU_PARA_ENTREGA,
        ENTREGUE,
        FINALIZADO,
        CANCELADO
    }
}
