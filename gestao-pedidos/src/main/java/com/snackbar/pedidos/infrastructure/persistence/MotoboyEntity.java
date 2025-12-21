package com.snackbar.pedidos.infrastructure.persistence;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Entidade JPA para persistência de Motoboy.
 */
@Entity
@Table(name = "motoboys")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MotoboyEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false, length = 200)
    private String nome;

    @Column(nullable = false, length = 20, unique = true)
    private String telefone;

    @Column(length = 100)
    private String veiculo;

    @Column(length = 10)
    private String placa;

    @Column(nullable = false)
    @Builder.Default
    private Boolean ativo = true;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
