package com.snackbar.pedidos.application.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO para descrição de movimentação com contagem de uso.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DescricaoMovimentacaoDTO {
    private String descricao;
    private Long quantidade;
}
