package com.sonecadelivery.pedidos.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ItemPedidoDTO {
    private String produtoId;
    private String produtoNome;
    private int quantidade;
    private BigDecimal precoUnitario;
    private BigDecimal subtotal;
    private String observacoes;
    private List<ItemPedidoAdicionalDTO> adicionais;
}
