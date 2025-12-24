package com.sonecadelivery.pedidos.infrastructure.persistence;

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
    private String nome; // Nome completo do Google (read-only)

    @Column(length = 200)
    private String apelido; // Nome exibido, editável pelo admin

    @Column(length = 20)
    private String telefone; // Não obrigatório (pode ser nulo no cadastro via Google)

    @Column(length = 100)
    private String veiculo;

    @Column(length = 10)
    private String placa;

    @Column(nullable = false)
    @Builder.Default
    private Boolean ativo = true;

    // ========== Campos de Autenticação Google ==========
    @Column(name = "google_id", length = 255, unique = true)
    private String googleId;

    @Column(length = 255, unique = true)
    private String email;

    @Column(name = "foto_url", length = 500)
    private String fotoUrl;

    @Column(name = "ultimo_login")
    private LocalDateTime ultimoLogin;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
