package com.sonecadelivery.pedidos.domain.entities;

public enum MeioPagamento {
    PIX("PIX"),
    CARTAO_CREDITO("Cartão de Crédito"),
    CARTAO_DEBITO("Cartão de Débito"),
    VALE_REFEICAO("Vale Refeição"),
    DINHEIRO("Dinheiro");
    
    private final String descricao;
    
    MeioPagamento(String descricao) {
        this.descricao = descricao;
    }
    
    public String getDescricao() {
        return descricao;
    }
}

