package com.sonecadelivery.pedidos.infrastructure.persistence;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "pedidos")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PedidoEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false, unique = true, length = 10)
    private String numeroPedido;

    @Column(nullable = false, length = 36)
    private String clienteId;

    @Column(nullable = false, length = 200)
    private String clienteNome;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private com.sonecadelivery.pedidos.domain.entities.StatusPedido status;

    @OneToMany(mappedBy = "pedido", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private Set<ItemPedidoEntity> itens = new HashSet<>();

    @OneToMany(mappedBy = "pedido", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private Set<MeioPagamentoPedidoEntity> meiosPagamento = new HashSet<>();

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal valorTotal;

    @Column(columnDefinition = "TEXT")
    private String observacoes;

    @Column(nullable = true, length = 36)
    private String usuarioId;

    @Column(length = 36)
    private String sessaoId;

    @Column(name = "mesa_id", length = 36)
    private String mesaId;

    @Column(name = "numero_mesa")
    private Integer numeroMesa;

    @Column(name = "nome_cliente_mesa", length = 100)
    private String nomeClienteMesa;

    // ========== Campos de Delivery ==========
    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_pedido", length = 20)
    @Builder.Default
    private com.sonecadelivery.pedidos.domain.entities.TipoPedido tipoPedido = com.sonecadelivery.pedidos.domain.entities.TipoPedido.BALCAO;

    @Column(name = "endereco_entrega", columnDefinition = "TEXT")
    private String enderecoEntrega;

    @Column(name = "motoboy_id", length = 36)
    private String motoboyId;

    @Column(name = "taxa_entrega", precision = 10, scale = 2)
    private BigDecimal taxaEntrega;

    @Column(name = "previsao_entrega")
    private LocalDateTime previsaoEntrega;

    @Column(nullable = false)
    private LocalDateTime dataPedido;

    @Column(nullable = true)
    private LocalDateTime dataFinalizacao;

    @Version
    @Builder.Default
    private Long version = 0L;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
