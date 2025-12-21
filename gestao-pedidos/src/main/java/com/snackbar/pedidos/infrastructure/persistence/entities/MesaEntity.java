package com.snackbar.pedidos.infrastructure.persistence.entities;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Entidade JPA para persistência de Mesa.
 */
@Entity
@Table(name = "mesas")
@Data
@NoArgsConstructor
public class MesaEntity {

    @Id
    @Column(length = 36)
    private String id;

    @Column(nullable = false, unique = true)
    private Integer numero;

    @Column(nullable = false, length = 100)
    private String nome;

    @Column(name = "qr_code_token", nullable = false, unique = true, length = 64)
    private String qrCodeToken;

    @Column(nullable = false)
    private Boolean ativa = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (updatedAt == null) {
            updatedAt = LocalDateTime.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
