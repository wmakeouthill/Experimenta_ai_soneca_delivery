package com.sonecadelivery.pedidos.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ItemPedidoAdicionalDTO {
    private String adicionalId;
    private String adicionalNome;
    private int quantidade;
    private BigDecimal precoUnitario;
    private BigDecimal subtotal;
}
