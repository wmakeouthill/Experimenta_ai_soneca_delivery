package com.sonecadelivery.kernel.domain.valueobjects;

import com.sonecadelivery.kernel.domain.exceptions.ValidationException;
import lombok.Value;

import java.util.regex.Pattern;

@Value
public class Email {
    String value;
    private static final Pattern EMAIL_PATTERN = Pattern.compile(
        "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$"
    );
    
    private Email(String value) {
        if (value == null || value.trim().isEmpty()) {
            throw new ValidationException("Email não pode ser nulo ou vazio");
        }
        String trimmedValue = value.trim().toLowerCase();
        if (!EMAIL_PATTERN.matcher(trimmedValue).matches()) {
            throw new ValidationException("Email inválido: " + value);
        }
        this.value = trimmedValue;
    }
    
    public static Email of(String value) {
        return new Email(value);
    }
}

