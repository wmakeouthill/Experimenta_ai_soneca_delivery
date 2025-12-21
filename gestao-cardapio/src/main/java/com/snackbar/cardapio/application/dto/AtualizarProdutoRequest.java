package com.snackbar.cardapio.application.dto;

import jakarta.validation.constraints.DecimalMin;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AtualizarProdutoRequest {
    private String nome;
    private String descricao;
    
    @DecimalMin(value = "0.01", message = "Preço deve ser maior que zero")
    private BigDecimal preco;
    
    private String categoria;
    private Boolean disponivel;
    private String foto; // Base64 string da imagem (opcional)
}

