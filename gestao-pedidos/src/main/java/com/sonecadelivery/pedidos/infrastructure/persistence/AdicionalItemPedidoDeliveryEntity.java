package com.sonecadelivery.pedidos.infrastructure.persistence;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

/**
 * Entidade JPA para adicionais de item de pedido delivery.
 */
@Entity
@Table(name = "adicionais_item_pedido_delivery", indexes = {
        @Index(name = "idx_adicionais_item_pedido_delivery_item", columnList = "item_pedido_delivery_id"),
        @Index(name = "idx_adicionais_item_pedido_delivery_adicional", columnList = "adicional_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdicionalItemPedidoDeliveryEntity {

    @Id
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_pedido_delivery_id", nullable = false)
    private ItemPedidoDeliveryEntity itemPedidoDelivery;

    @Column(name = "adicional_id", length = 36, nullable = false)
    private String adicionalId;

    @Column(name = "nome_adicional", length = 200, nullable = false)
    private String nomeAdicional;

    @Column(nullable = false)
    private Integer quantidade;

    @Column(name = "preco_unitario", precision = 10, scale = 2, nullable = false)
    private BigDecimal precoUnitario;

    @Column(name = "subtotal", precision = 10, scale = 2, nullable = false)
    private BigDecimal subtotal;

    /**
     * Calcula o subtotal do adicional: precoUnitario * quantidade
     */
    public void calcularSubtotal() {
        this.subtotal = precoUnitario.multiply(BigDecimal.valueOf(quantidade));
    }
}
