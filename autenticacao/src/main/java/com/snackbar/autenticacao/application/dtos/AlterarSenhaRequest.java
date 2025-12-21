package com.snackbar.autenticacao.application.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AlterarSenhaRequest(
    @NotBlank(message = "Senha atual é obrigatória")
    String senhaAtual,
    
    @NotBlank(message = "Nova senha é obrigatória")
    @Size(min = 6, max = 100, message = "Nova senha deve ter entre 6 e 100 caracteres")
    String novaSenha
) {}

