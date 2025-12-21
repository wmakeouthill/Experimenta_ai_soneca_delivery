package com.sonecadelivery.pedidos.application.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO para estatísticas de movimentação por descrição.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EstatisticaMovimentacaoDTO {
    private String descricao;
    private Long quantidade;
    private BigDecimal valorTotal;
}
