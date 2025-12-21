package com.sonecadelivery.clientes.infrastructure.persistence;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Entidade JPA para persistência de Favoritos do Cliente.
 * Relacionamento N:N entre Cliente e Produto.
 */
@Entity
@Table(name = "cliente_favoritos")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClienteFavoritoEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "cliente_id", nullable = false, length = 36)
    private String clienteId;

    @Column(name = "produto_id", nullable = false, length = 36)
    private String produtoId;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
