package com.snackbar.pedidos.application.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Request para finalizar uma sessão de trabalho.
 * Inclui o valor de fechamento do caixa que é obrigatório.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FinalizarSessaoRequest {
    
    @NotNull(message = "Valor de fechamento do caixa é obrigatório")
    @DecimalMin(value = "0.00", message = "Valor de fechamento não pode ser negativo")
    private BigDecimal valorFechamento;
}

