package com.snackbar.clientes.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClienteLoginResponse {

    private String token;
    private String tipo;
    private ClienteDTO cliente;

    public static ClienteLoginResponse of(String token, ClienteDTO cliente) {
        return ClienteLoginResponse.builder()
                .token(token)
                .tipo("Bearer")
                .cliente(cliente)
                .build();
    }
}
