package com.sonecadelivery.pedidos.infrastructure.persistence;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "itens_pedido_adicionais")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ItemPedidoAdicionalEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_pedido_id", nullable = false)
    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    private ItemPedidoEntity itemPedido;

    @Column(name = "adicional_id", nullable = false, length = 36)
    private String adicionalId;

    @Column(name = "adicional_nome", nullable = false, length = 200)
    private String adicionalNome;

    @Column(nullable = false)
    private int quantidade;

    @Column(name = "preco_unitario", nullable = false, precision = 10, scale = 2)
    private BigDecimal precoUnitario;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
