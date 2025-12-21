package com.snackbar.autenticacao.application.dtos;

public record LoginResponse(
    String token,
    String tipo,
    UsuarioDTO usuario
) {
    public static LoginResponse of(String token, UsuarioDTO usuario) {
        return new LoginResponse(token, "Bearer", usuario);
    }
}

