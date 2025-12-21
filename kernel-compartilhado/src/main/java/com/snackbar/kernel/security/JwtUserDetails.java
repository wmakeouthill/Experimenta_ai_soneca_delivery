package com.snackbar.kernel.security;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * Objeto que representa os detalhes do usuário extraídos do JWT.
 * Usado no SecurityContext para fornecer tanto email quanto ID do usuário.
 */
@Getter
@RequiredArgsConstructor
public class JwtUserDetails {
    private final String email;
    private final String id;

    @Override
    public String toString() {
        return email; // Para compatibilidade com código que espera String
    }
}
