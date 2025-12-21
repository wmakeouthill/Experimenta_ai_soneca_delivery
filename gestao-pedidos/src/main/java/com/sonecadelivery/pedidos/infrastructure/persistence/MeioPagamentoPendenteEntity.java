package com.sonecadelivery.pedidos.infrastructure.persistence;

import com.sonecadelivery.pedidos.domain.entities.MeioPagamento;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.math.BigDecimal;

/**
 * Entidade JPA para meios de pagamento de pedido pendente de mesa.
 */
@Entity
@Table(name = "meios_pagamento_pendente_mesa")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MeioPagamentoPendenteEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pedido_pendente_id", nullable = false)
    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    private PedidoPendenteEntity pedidoPendente;

    @Enumerated(EnumType.STRING)
    @Column(name = "meio_pagamento", nullable = false, length = 20)
    private MeioPagamento meioPagamento;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal valor;
}
