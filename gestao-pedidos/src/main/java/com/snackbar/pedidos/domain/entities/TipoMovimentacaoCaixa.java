package com.snackbar.pedidos.domain.entities;

/**
 * Enum que representa os tipos de movimentação de caixa.
 */
public enum TipoMovimentacaoCaixa {
    ABERTURA("Abertura de Caixa"),
    VENDA_DINHEIRO("Venda em Dinheiro"),
    SANGRIA("Sangria de Caixa"),
    SUPRIMENTO("Suprimento de Caixa"),
    FECHAMENTO("Fechamento de Caixa");

    private final String descricao;

    TipoMovimentacaoCaixa(String descricao) {
        this.descricao = descricao;
    }

    public String getDescricao() {
        return descricao;
    }
}

