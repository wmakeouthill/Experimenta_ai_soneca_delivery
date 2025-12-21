package com.snackbar.autenticacao.domain.valueobjects;

import com.snackbar.kernel.domain.exceptions.ValidationException;
import lombok.Getter;

import java.util.regex.Pattern;

@Getter
public class Email {
    private static final Pattern EMAIL_PATTERN = Pattern.compile(
        "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$"
    );
    
    private final String valor;
    
    private Email(String valor) {
        this.valor = valor;
    }
    
    public static Email of(String email) {
        if (email == null || email.trim().isEmpty()) {
            throw new ValidationException("Email não pode ser nulo ou vazio");
        }
        
        String emailNormalizado = email.trim().toLowerCase();
        
        if (!EMAIL_PATTERN.matcher(emailNormalizado).matches()) {
            throw new ValidationException("Email inválido: " + email);
        }
        
        return new Email(emailNormalizado);
    }
    
    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (obj == null || getClass() != obj.getClass()) return false;
        Email email = (Email) obj;
        return valor.equals(email.valor);
    }
    
    @Override
    public int hashCode() {
        return valor.hashCode();
    }
    
    @Override
    public String toString() {
        return valor;
    }
}

