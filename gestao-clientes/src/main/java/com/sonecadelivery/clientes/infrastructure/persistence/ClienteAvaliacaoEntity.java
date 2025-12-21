package com.sonecadelivery.clientes.infrastructure.persistence;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Entidade JPA para persistência de Avaliações do Cliente.
 * Cliente pode avaliar produtos após realizar pedidos.
 */
@Entity
@Table(name = "cliente_avaliacoes")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClienteAvaliacaoEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "cliente_id", nullable = false, length = 36)
    private String clienteId;

    @Column(name = "produto_id", nullable = false, length = 36)
    private String produtoId;

    @Column(name = "pedido_id", nullable = false, length = 36)
    private String pedidoId;

    @Column(nullable = false)
    private Integer nota; // 1 a 5

    @Column(columnDefinition = "TEXT")
    private String comentario;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
