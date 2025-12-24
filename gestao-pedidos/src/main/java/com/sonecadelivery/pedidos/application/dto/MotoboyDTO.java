package com.sonecadelivery.pedidos.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO para transferência de dados de Motoboy.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MotoboyDTO {
    private String id;
    private String nome; // Nome completo do Google (read-only)
    private String apelido; // Nome exibido, editável pelo admin
    private String telefone;
    private String veiculo;
    private String placa;
    private boolean ativo;
    
    // Campos de autenticação Google
    private String googleId;
    private String email;
    private String fotoUrl;
    private LocalDateTime ultimoLogin;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /**
     * Cria DTO a partir da entidade de domínio.
     */
    public static MotoboyDTO de(com.sonecadelivery.pedidos.domain.entities.Motoboy motoboy) {
        return MotoboyDTO.builder()
                .id(motoboy.getId())
                .nome(motoboy.getNome())
                .apelido(motoboy.getApelido())
                .telefone(motoboy.getTelefone())
                .veiculo(motoboy.getVeiculo())
                .placa(motoboy.getPlaca())
                .ativo(motoboy.isAtivo())
                .googleId(motoboy.getGoogleId())
                .email(motoboy.getEmail())
                .fotoUrl(motoboy.getFotoUrl())
                .ultimoLogin(motoboy.getUltimoLogin())
                .createdAt(motoboy.getCreatedAt())
                .updatedAt(motoboy.getUpdatedAt())
                .build();
    }
}
