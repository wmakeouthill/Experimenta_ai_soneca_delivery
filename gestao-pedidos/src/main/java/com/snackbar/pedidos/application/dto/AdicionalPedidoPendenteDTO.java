package com.snackbar.pedidos.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO para adicional de item de pedido pendente.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdicionalPedidoPendenteDTO {

    private String adicionalId;
    private String nome;
    private int quantidade;
    private BigDecimal precoUnitario;
    private BigDecimal subtotal;
}
