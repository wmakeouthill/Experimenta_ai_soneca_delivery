package com.snackbar.pedidos.application.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Request para iniciar uma nova sessão de trabalho.
 * Inclui o valor de abertura do caixa que é obrigatório.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class IniciarSessaoRequest {
    
    @NotBlank(message = "ID do usuário é obrigatório")
    private String usuarioId;
    
    @NotNull(message = "Valor de abertura do caixa é obrigatório")
    @DecimalMin(value = "0.00", message = "Valor de abertura não pode ser negativo")
    private BigDecimal valorAbertura;
}

