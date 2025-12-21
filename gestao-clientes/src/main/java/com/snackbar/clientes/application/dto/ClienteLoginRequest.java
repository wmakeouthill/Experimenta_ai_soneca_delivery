package com.snackbar.clientes.application.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClienteLoginRequest {

    @NotBlank(message = "Telefone é obrigatório")
    private String telefone;

    @NotBlank(message = "Senha é obrigatória")
    private String senha;
}
