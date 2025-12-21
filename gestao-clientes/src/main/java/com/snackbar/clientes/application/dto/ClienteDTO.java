package com.snackbar.clientes.application.dto;

import com.snackbar.clientes.domain.entities.Cliente;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClienteDTO {
    private String id;
    private String nome;
    private String telefone;
    private String email;
    private String cpf;
    private String observacoes;

    // Campos de autenticação (públicos)
    private String fotoUrl;
    private boolean emailVerificado;
    private boolean temSenha;
    private boolean temContaGoogle;
    private LocalDateTime ultimoLogin;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ClienteDTO de(Cliente cliente) {
        return ClienteDTO.builder()
                .id(cliente.getId())
                .nome(cliente.getNome())
                .telefone(cliente.getTelefone())
                .email(cliente.getEmail())
                .cpf(cliente.getCpf())
                .observacoes(cliente.getObservacoes())
                // Campos de autenticação
                .fotoUrl(cliente.getFotoUrl())
                .emailVerificado(cliente.isEmailVerificado())
                .temSenha(cliente.temSenha())
                .temContaGoogle(cliente.temContaGoogle())
                .ultimoLogin(cliente.getUltimoLogin())
                // Timestamps
                .createdAt(cliente.getCreatedAt())
                .updatedAt(cliente.getUpdatedAt())
                .build();
    }
}
