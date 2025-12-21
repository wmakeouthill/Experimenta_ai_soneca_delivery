package com.sonecadelivery.pedidos.infrastructure.persistence;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.math.BigDecimal;

@Entity
@Table(name = "meios_pagamento_pedido")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MeioPagamentoPedidoEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pedido_id", nullable = false)
    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    private PedidoEntity pedido;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private com.sonecadelivery.pedidos.domain.entities.MeioPagamento meioPagamento;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal valor;
}
