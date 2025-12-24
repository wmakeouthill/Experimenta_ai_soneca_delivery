package com.sonecadelivery.pedidos.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO para resposta de login/cadastro de motoboy.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MotoboyLoginResponse {

    private String token;
    private String tipo;
    private MotoboyDTO motoboy;

    public static MotoboyLoginResponse of(String token, MotoboyDTO motoboy) {
        return MotoboyLoginResponse.builder()
                .token(token)
                .tipo("Bearer")
                .motoboy(motoboy)
                .build();
    }
}

