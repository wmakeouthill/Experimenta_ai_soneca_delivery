package com.sonecadelivery.pedidos.application.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO para requisição de login/cadastro de motoboy via Google OAuth.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MotoboyGoogleLoginRequest {

    @NotBlank(message = "Token do Google é obrigatório")
    private String googleToken;
}

