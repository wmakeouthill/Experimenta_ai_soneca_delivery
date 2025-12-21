package com.sonecadelivery.kernel.domain.exceptions;

/**
 * Exceção lançada quando um recurso não é encontrado.
 */
public class NotFoundException extends DomainException {
    
    public NotFoundException(String message) {
        super(message);
    }
    
    public NotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
}

