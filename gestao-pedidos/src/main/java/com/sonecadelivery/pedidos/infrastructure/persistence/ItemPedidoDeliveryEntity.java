package com.sonecadelivery.pedidos.infrastructure.persistence;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Entidade JPA para itens de pedido delivery.
 */
@Entity
@Table(name = "itens_pedido_delivery", indexes = {
        @Index(name = "idx_itens_pedido_delivery_pedido", columnList = "pedido_delivery_id"),
        @Index(name = "idx_itens_pedido_delivery_produto", columnList = "produto_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ItemPedidoDeliveryEntity {

    @Id
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pedido_delivery_id", nullable = false)
    private PedidoDeliveryEntity pedidoDelivery;

    @Column(name = "produto_id", length = 36, nullable = false)
    private String produtoId;

    @Column(name = "nome_produto", length = 200, nullable = false)
    private String nomeProduto;

    @Column(name = "descricao_produto", columnDefinition = "TEXT")
    private String descricaoProduto;

    @Column(nullable = false)
    private Integer quantidade;

    @Column(name = "preco_unitario", precision = 10, scale = 2, nullable = false)
    private BigDecimal precoUnitario;

    @Column(name = "valor_adicionais", precision = 10, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal valorAdicionais = BigDecimal.ZERO;

    @Column(name = "subtotal", precision = 10, scale = 2, nullable = false)
    private BigDecimal subtotal;

    @Column(columnDefinition = "TEXT")
    private String observacoes;

    @Column(name = "ordem", nullable = false)
    @Builder.Default
    private Integer ordem = 0;

    // ===== Adicionais =====
    @OneToMany(mappedBy = "itemPedidoDelivery", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<AdicionalItemPedidoDeliveryEntity> adicionais = new ArrayList<>();

    public void adicionarAdicional(AdicionalItemPedidoDeliveryEntity adicional) {
        adicionais.add(adicional);
        adicional.setItemPedidoDelivery(this);
    }

    /**
     * Calcula o subtotal do item: (precoUnitario + valorAdicionais) * quantidade
     */
    public void calcularSubtotal() {
        BigDecimal precoComAdicionais = precoUnitario.add(valorAdicionais);
        this.subtotal = precoComAdicionais.multiply(BigDecimal.valueOf(quantidade));
    }
}
