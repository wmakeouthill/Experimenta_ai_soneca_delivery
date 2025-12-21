package com.snackbar.pedidos.infrastructure.persistence;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "itens_pedido")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ItemPedidoEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pedido_id", nullable = false)
    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    private PedidoEntity pedido;

    @Column(nullable = false, length = 36)
    private String produtoId;

    @Column(nullable = false, length = 200)
    private String produtoNome;

    @Column(nullable = false)
    private int quantidade;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal precoUnitario;

    @Column(columnDefinition = "TEXT")
    private String observacoes;

    @OneToMany(mappedBy = "itemPedido", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @Builder.Default
    private Set<ItemPedidoAdicionalEntity> adicionais = new HashSet<>();

    public void adicionarAdicional(ItemPedidoAdicionalEntity adicional) {
        adicionais.add(adicional);
        adicional.setItemPedido(this);
    }

    public void removerAdicional(ItemPedidoAdicionalEntity adicional) {
        adicionais.remove(adicional);
        adicional.setItemPedido(null);
    }
}
