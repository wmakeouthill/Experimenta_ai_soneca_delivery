package com.sonecadelivery.autenticacao.domain.valueobjects;

import com.sonecadelivery.kernel.domain.exceptions.ValidationException;
import lombok.Getter;

@Getter
public class Senha {
    private static final int MIN_LENGTH = 6;
    private static final int MAX_LENGTH = 100;
    
    private final String hash;
    
    private Senha(String hash) {
        this.hash = hash;
    }
    
    public static Senha criarHash(String senhaPlana) {
        if (senhaPlana == null || senhaPlana.trim().isEmpty()) {
            throw new ValidationException("Senha não pode ser nula ou vazia");
        }
        
        if (senhaPlana.length() < MIN_LENGTH) {
            throw new ValidationException("Senha deve ter no mínimo " + MIN_LENGTH + " caracteres");
        }
        
        if (senhaPlana.length() > MAX_LENGTH) {
            throw new ValidationException("Senha deve ter no máximo " + MAX_LENGTH + " caracteres");
        }
        
        return new Senha(senhaPlana);
    }
    
    public static Senha restaurarHash(String hash) {
        if (hash == null || hash.trim().isEmpty()) {
            throw new ValidationException("Hash de senha não pode ser nulo ou vazio");
        }
        
        return new Senha(hash);
    }
    
    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (obj == null || getClass() != obj.getClass()) return false;
        Senha senha = (Senha) obj;
        return hash.equals(senha.hash);
    }
    
    @Override
    public int hashCode() {
        return hash.hashCode();
    }
}

