package com.sonecadelivery.clientes.application.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClienteGoogleLoginRequest {

    @NotBlank(message = "Token do Google é obrigatório")
    private String googleToken;
}
