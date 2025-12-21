package com.snackbar.pedidos.domain.valueobjects;

import com.snackbar.kernel.domain.exceptions.ValidationException;

import java.security.SecureRandom;
import java.util.Base64;

/**
 * Value Object para o token único do QR Code da mesa.
 * Gera um token criptograficamente seguro e único.
 */
public record QrCodeToken(String valor) {

    private static final int TOKEN_LENGTH = 32;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    public QrCodeToken {
        if (valor == null || valor.isBlank()) {
            throw new ValidationException("Token do QR Code não pode ser nulo ou vazio");
        }
        if (valor.length() < 16 || valor.length() > 64) {
            throw new ValidationException("Token do QR Code deve ter entre 16 e 64 caracteres");
        }
    }

    /**
     * Gera um novo token único para QR Code.
     */
    public static QrCodeToken gerar() {
        byte[] bytes = new byte[TOKEN_LENGTH];
        SECURE_RANDOM.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        return new QrCodeToken(token);
    }

    /**
     * Restaura um token existente do banco de dados.
     */
    public static QrCodeToken restaurar(String token) {
        return new QrCodeToken(token);
    }

    public String getValor() {
        return valor;
    }
}
