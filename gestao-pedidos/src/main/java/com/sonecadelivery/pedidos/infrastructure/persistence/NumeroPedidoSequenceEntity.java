package com.sonecadelivery.pedidos.infrastructure.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * Entidade para simular SEQUENCE de número de pedido.
 * 
 * MySQL não suporta SEQUENCE nativa como PostgreSQL,
 * então usamos uma tabela auxiliar com AUTO_INCREMENT
 * para garantir atomicidade na geração de números únicos.
 * 
 * @see NumeroPedidoSequenceRepository
 */
@Entity
@Table(name = "numero_pedido_sequence")
@Getter
public class NumeroPedidoSequenceEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
