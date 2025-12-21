package com.snackbar.clientes.domain.entities;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Builder
@AllArgsConstructor
public class ClienteFavorito {

    private final String id;
    private final String clienteId;
    private final String produtoId;
    private final LocalDateTime createdAt;

    public static ClienteFavorito criar(String clienteId, String produtoId) {
        return ClienteFavorito.builder()
                .id(UUID.randomUUID().toString())
                .clienteId(clienteId)
                .produtoId(produtoId)
                .createdAt(LocalDateTime.now())
                .build();
    }

    public static ClienteFavorito reconstruir(String id, String clienteId, String produtoId, LocalDateTime createdAt) {
        return ClienteFavorito.builder()
                .id(id)
                .clienteId(clienteId)
                .produtoId(produtoId)
                .createdAt(createdAt)
                .build();
    }
}
