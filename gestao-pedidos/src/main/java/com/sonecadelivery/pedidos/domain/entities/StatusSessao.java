package com.sonecadelivery.pedidos.domain.entities;

public enum StatusSessao {
    ABERTA("Aberta"),
    PAUSADA("Pausada"),
    FINALIZADA("Finalizada");
    
    private final String descricao;
    
    StatusSessao(String descricao) {
        this.descricao = descricao;
    }
    
    public String getDescricao() {
        return descricao;
    }
    
    public boolean podeSerPausada() {
        return this == ABERTA;
    }
    
    public boolean podeSerRetomada() {
        return this == PAUSADA;
    }
    
    public boolean podeSerFinalizada() {
        return this == ABERTA || this == PAUSADA;
    }
    
    public boolean estaAtiva() {
        return this == ABERTA || this == PAUSADA;
    }
}

