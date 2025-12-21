package com.snackbar.cardapio.application.dto;

import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class AtualizarAdicionalRequest {
    private String nome;
    private String descricao;

    @Positive(message = "Preço deve ser maior que zero")
    private BigDecimal preco;

    private String categoria;
    private Boolean disponivel;
}
