package com.snackbar.pedidos.domain.entities;

/**
 * Enum que representa as unidades de medida disponíveis para itens de estoque.
 */
public enum UnidadeMedida {
    UN("Unidade"),
    KG("Quilograma"),
    G("Grama"),
    LT("Litro"),
    ML("Mililitro"),
    PCT("Pacote"),
    CX("Caixa");

    private final String descricao;

    UnidadeMedida(String descricao) {
        this.descricao = descricao;
    }

    public String getDescricao() {
        return descricao;
    }
}

