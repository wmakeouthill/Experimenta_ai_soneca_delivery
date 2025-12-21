package com.snackbar.pedidos.application.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO para estatísticas completas de movimentações de caixa.
 * Contém estatísticas separadas para sangrias e suprimentos.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EstatisticasCaixaDTO {
    private List<EstatisticaMovimentacaoDTO> sangrias;
    private List<EstatisticaMovimentacaoDTO> suprimentos;
}
