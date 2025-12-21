package com.sonecadelivery.kernel.infrastructure.mappers;

/**
 * Exceção lançada quando ocorre erro ao criar uma instância de mapper.
 * 
 * @author Sistema Snackbar
 */
public class MapperCreationException extends RuntimeException {
    
    public MapperCreationException(String message) {
        super(message);
    }
    
    public MapperCreationException(String message, Throwable cause) {
        super(message, cause);
    }
}

