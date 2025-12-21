package com.sonecadelivery.pedidos.infrastructure.persistence;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.math.BigDecimal;

/**
 * Entidade JPA para adicionais de item de pedido pendente.
 */
@Entity
@Table(name = "adicionais_item_pedido_pendente_mesa")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdicionalItemPedidoPendenteEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_pedido_pendente_id", nullable = false)
    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    private ItemPedidoPendenteEntity itemPedidoPendente;

    @Column(name = "adicional_id", nullable = false, length = 36)
    private String adicionalId;

    @Column(nullable = false, length = 200)
    private String nome;

    @Column(nullable = false)
    private Integer quantidade;

    @Column(name = "preco_unitario", nullable = false, precision = 10, scale = 2)
    private BigDecimal precoUnitario;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal subtotal;
}
