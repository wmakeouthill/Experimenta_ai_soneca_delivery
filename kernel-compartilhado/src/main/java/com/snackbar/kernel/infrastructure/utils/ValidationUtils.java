package com.snackbar.kernel.infrastructure.utils;

import com.snackbar.kernel.domain.exceptions.ValidationException;

public class ValidationUtils {
    
    private ValidationUtils() {
        // Classe utilitária - não deve ser instanciada
    }
    
    public static void requireNonNull(Object object, String fieldName) {
        if (object == null) {
            throw new ValidationException(fieldName + " não pode ser nulo");
        }
    }
    
    public static void requireNonEmpty(String value, String fieldName) {
        if (value == null || value.trim().isEmpty()) {
            throw new ValidationException(fieldName + " não pode ser nulo ou vazio");
        }
    }
    
    public static void requirePositive(Number number, String fieldName) {
        if (number == null) {
            throw new ValidationException(fieldName + " não pode ser nulo");
        }
        if (number.doubleValue() <= 0) {
            throw new ValidationException(fieldName + " deve ser positivo");
        }
    }
    
    public static void requireNonNegative(Number number, String fieldName) {
        if (number == null) {
            throw new ValidationException(fieldName + " não pode ser nulo");
        }
        if (number.doubleValue() < 0) {
            throw new ValidationException(fieldName + " não pode ser negativo");
        }
    }
}

