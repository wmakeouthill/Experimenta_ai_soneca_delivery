package com.sonecadelivery.clientes.infrastructure.persistence;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "clientes")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClienteEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false, length = 200)
    private String nome;

    @Column(length = 20)
    private String telefone;

    @Column(length = 200)
    private String email;

    @Column(length = 14)
    private String cpf;

    @Column(columnDefinition = "TEXT")
    private String observacoes;

    // ========== Campos de Autenticação ==========

    @Column(name = "senha_hash", length = 255)
    private String senhaHash;

    @Column(name = "google_id", length = 255, unique = true)
    private String googleId;

    @Column(name = "foto_url", length = 500)
    private String fotoUrl;

    @Column(name = "email_verificado", nullable = false)
    @Builder.Default
    private Boolean emailVerificado = false;

    @Column(name = "ultimo_login")
    private LocalDateTime ultimoLogin;

    // ========== Campos de Endereço (Delivery) ==========

    @Column(length = 255)
    private String logradouro;

    @Column(length = 20)
    private String numero;

    @Column(length = 100)
    private String complemento;

    @Column(length = 100)
    private String bairro;

    @Column(length = 100)
    private String cidade;

    @Column(length = 2)
    private String estado;

    @Column(length = 9)
    private String cep;

    @Column(name = "ponto_referencia", length = 255)
    private String pontoReferencia;

    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    // ========== Timestamps ==========

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
