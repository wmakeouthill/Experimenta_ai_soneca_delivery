package com.snackbar.cardapio.domain.valueobjects;

import com.snackbar.kernel.domain.valueobjects.Money;
import lombok.Value;

import java.math.BigDecimal;

@Value
public class Preco {
    Money money;
    
    private Preco(Money money) {
        this.money = money;
    }
    
    public static Preco of(Money money) {
        return new Preco(money);
    }
    
    public static Preco of(BigDecimal amount) {
        return new Preco(Money.of(amount));
    }
    
    public static Preco of(double amount) {
        return new Preco(Money.of(amount));
    }
    
    public static Preco zero() {
        return new Preco(Money.zero());
    }
    
    public BigDecimal getAmount() {
        return money.getAmount();
    }
    
    public Preco add(Preco other) {
        return new Preco(money.add(other.money));
    }
    
    public Preco subtract(Preco other) {
        return new Preco(money.subtract(other.money));
    }
    
    public Preco multiply(int quantity) {
        return new Preco(money.multiply(quantity));
    }
    
    public Preco multiply(double factor) {
        return new Preco(money.multiply(factor));
    }
    
    public boolean isGreaterThan(Preco other) {
        return money.isGreaterThan(other.money);
    }
    
    public boolean isLessThan(Preco other) {
        return money.isLessThan(other.money);
    }
}

