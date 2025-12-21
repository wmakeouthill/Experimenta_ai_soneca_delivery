package com.snackbar.autenticacao.application.dtos;

import com.snackbar.autenticacao.domain.entities.Role;
import jakarta.validation.constraints.Size;

public record AtualizarUsuarioRequest(
    @Size(min = 3, max = 100, message = "Nome deve ter entre 3 e 100 caracteres")
    String nome,
    
    Role role,
    
    Boolean ativo
) {}

