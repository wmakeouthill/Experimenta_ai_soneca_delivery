package com.sonecadelivery.chatia.domain.valueobjects;

import java.util.Objects;
import java.util.UUID;

/**
 * Value Object que representa o identificador de uma sessão de chat.
 */
public record SessionId(String valor) {
    
    public SessionId {
        Objects.requireNonNull(valor, "SessionId não pode ser nulo");
        if (valor.isBlank()) {
            throw new IllegalArgumentException("SessionId não pode ser vazio");
        }
    }
    
    public static SessionId gerar() {
        return new SessionId(UUID.randomUUID().toString());
    }
    
    public static SessionId de(String valor) {
        return new SessionId(valor);
    }
    
    @Override
    public String toString() {
        return valor;
    }
}
