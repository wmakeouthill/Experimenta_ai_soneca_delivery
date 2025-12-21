package com.snackbar.pedidos.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * DTO para item de pedido pendente.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ItemPedidoPendenteDTO {

    private String produtoId;
    private String nomeProduto;
    private int quantidade;
    private BigDecimal precoUnitario;
    private BigDecimal subtotal;
    private String observacoes;
    private List<AdicionalPedidoPendenteDTO> adicionais;
}
