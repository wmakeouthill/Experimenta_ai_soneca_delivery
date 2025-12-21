package com.sonecadelivery.kernel.domain.valueobjects;

import com.sonecadelivery.kernel.domain.exceptions.ValidationException;
import lombok.Value;

import java.util.regex.Pattern;

@Value
public class CPF {
    String value;
    private static final Pattern CPF_PATTERN = Pattern.compile("^\\d{11}$");
    private static final Pattern NON_DIGIT_PATTERN = Pattern.compile("\\\\D+");

    private CPF(String value) {
        if (value == null || value.trim().isEmpty()) {
            throw new ValidationException("CPF não pode ser nulo ou vazio");
        }
        String cleanedValue = NON_DIGIT_PATTERN.matcher(value).replaceAll("");
        if (cleanedValue.length() != 11) {
            throw new ValidationException("CPF deve conter 11 dígitos");
        }
        if (!CPF_PATTERN.matcher(cleanedValue).matches()) {
            throw new ValidationException("CPF inválido: formato incorreto");
        }
        if (!isValidCPF(cleanedValue)) {
            throw new ValidationException("CPF inválido: dígitos verificadores incorretos");
        }
        this.value = cleanedValue;
    }

    public static CPF of(String value) {
        return new CPF(value);
    }

    private static boolean isValidCPF(String cpf) {
        if (cpf.matches("(\\d)\\1{10}")) {
            return false;
        }

        int[] digits = cpf.chars().map(Character::getNumericValue).toArray();

        int sum = 0;
        for (int i = 0; i < 9; i++) {
            sum += digits[i] * (10 - i);
        }
        int firstDigit = 11 - (sum % 11);
        if (firstDigit >= 10)
            firstDigit = 0;
        if (firstDigit != digits[9])
            return false;

        sum = 0;
        for (int i = 0; i < 10; i++) {
            sum += digits[i] * (11 - i);
        }
        int secondDigit = 11 - (sum % 11);
        if (secondDigit >= 10)
            secondDigit = 0;
        return secondDigit == digits[10];
    }

    public String getFormatted() {
        return String.format("%s.%s.%s-%s",
                value.substring(0, 3),
                value.substring(3, 6),
                value.substring(6, 9),
                value.substring(9, 11));
    }
}
