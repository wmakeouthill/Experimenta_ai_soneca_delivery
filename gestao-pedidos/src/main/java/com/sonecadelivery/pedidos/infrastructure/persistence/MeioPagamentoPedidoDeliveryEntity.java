package com.sonecadelivery.pedidos.infrastructure.persistence;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

/**
 * Entidade JPA para meios de pagamento do pedido delivery.
 * Permite múltiplos meios de pagamento por pedido (ex: parte cartão, parte
 * dinheiro).
 */
@Entity
@Table(name = "meios_pagamento_pedido_delivery", indexes = {
        @Index(name = "idx_meios_pagamento_pedido_delivery_pedido", columnList = "pedido_delivery_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MeioPagamentoPedidoDeliveryEntity {

    @Id
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pedido_delivery_id", nullable = false)
    private PedidoDeliveryEntity pedidoDelivery;

    @Column(name = "tipo_pagamento", length = 50, nullable = false)
    private String tipoPagamento;

    @Column(precision = 10, scale = 2, nullable = false)
    private BigDecimal valor;

    @Column(name = "troco_para", precision = 10, scale = 2)
    private BigDecimal trocoPara;

    @Column(columnDefinition = "TEXT")
    private String observacoes;
}
