package com.sonecadelivery.pedidos.application.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO para requisição de atualização do valor do motoboy.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AtualizarValorMotoboyRequest {
    
    @NotNull(message = "Valor do motoboy é obrigatório")
    @DecimalMin(value = "0.0", message = "Valor do motoboy deve ser maior ou igual a zero")
    private BigDecimal valor;
}

