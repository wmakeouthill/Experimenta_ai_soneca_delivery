package com.sonecadelivery.pedidos.application.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Request para registrar uma movimentação de caixa (sangria ou suprimento).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegistrarMovimentacaoRequest {
    
    @NotNull(message = "Valor é obrigatório")
    @DecimalMin(value = "0.01", message = "Valor deve ser maior que zero")
    private BigDecimal valor;
    
    private String descricao;
}

