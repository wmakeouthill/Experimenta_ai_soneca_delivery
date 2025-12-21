package com.sonecadelivery.kernel.domain.valueobjects;

import com.sonecadelivery.kernel.domain.exceptions.ValidationException;
import lombok.Value;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Value
public class Money {
    BigDecimal amount;
    
    private Money(BigDecimal amount) {
        if (amount == null) {
            throw new ValidationException("Valor monetário não pode ser nulo");
        }
        if (amount.compareTo(BigDecimal.ZERO) < 0) {
            throw new ValidationException("Valor monetário não pode ser negativo");
        }
        this.amount = amount.setScale(2, RoundingMode.HALF_UP);
    }
    
    public static Money of(BigDecimal amount) {
        return new Money(amount);
    }
    
    public static Money of(double amount) {
        return new Money(BigDecimal.valueOf(amount));
    }
    
    public static Money zero() {
        return new Money(BigDecimal.ZERO);
    }
    
    public Money add(Money other) {
        return new Money(this.amount.add(other.amount));
    }
    
    public Money subtract(Money other) {
        return new Money(this.amount.subtract(other.amount));
    }
    
    public Money multiply(int quantity) {
        return new Money(this.amount.multiply(BigDecimal.valueOf(quantity)));
    }
    
    public Money multiply(double factor) {
        return new Money(this.amount.multiply(BigDecimal.valueOf(factor)));
    }
    
    public boolean isGreaterThan(Money other) {
        return this.amount.compareTo(other.amount) > 0;
    }
    
    public boolean isLessThan(Money other) {
        return this.amount.compareTo(other.amount) < 0;
    }
}

