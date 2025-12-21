package com.sonecadelivery.kernel.domain.exceptions;

/**
 * Exceção lançada quando uma regra de negócio é violada.
 * Esta classe é um alias para BusinessRuleException para manter compatibilidade.
 */
public class BusinessException extends BusinessRuleException {
    
    public BusinessException(String message) {
        super(message);
    }
    
    public BusinessException(String message, Throwable cause) {
        super(message, cause);
    }
}

