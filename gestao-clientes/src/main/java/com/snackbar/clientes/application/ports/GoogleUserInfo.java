package com.snackbar.clientes.application.ports;

/**
 * DTO para dados do usuário Google
 */
public record GoogleUserInfo(
        String googleId,
        String email,
        String nome,
        String fotoUrl,
        boolean emailVerificado) {
}
