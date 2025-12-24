package com.sonecadelivery.pedidos.application.ports;

/**
 * Port para serviço de autenticação Google.
 */
public interface GoogleAuthServicePort {

    /**
     * Valida o token do Google e retorna os dados do usuário.
     * 
     * @param googleToken Token ID do Google
     * @return Informações do usuário Google
     * @throws IllegalArgumentException se o token for inválido
     */
    GoogleUserInfo validarTokenGoogle(String googleToken);

    /**
     * DTO para dados do usuário Google.
     */
    record GoogleUserInfo(
            String googleId,
            String email,
            String nome,
            String fotoUrl,
            boolean emailVerificado) {
    }
}

