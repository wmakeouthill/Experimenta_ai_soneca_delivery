package com.sonecadelivery.autenticacao.application.dtos;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
    @NotBlank(message = "Email ou nome de usuário é obrigatório")
    String emailOuUsuario,
    
    @NotBlank(message = "Senha é obrigatória")
    String senha
) {}

