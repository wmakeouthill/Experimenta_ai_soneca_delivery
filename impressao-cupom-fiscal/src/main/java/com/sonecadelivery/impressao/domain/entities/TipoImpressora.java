package com.sonecadelivery.impressao.domain.entities;

public enum TipoImpressora {
    EPSON_TM_T20("EPSON TM-T20"),
    DARUMA_800("DARUMA DR-800"),
    GENERICA_ESCPOS("Genérica ESC/POS");
    
    private final String descricao;
    
    TipoImpressora(String descricao) {
        this.descricao = descricao;
    }
    
    public String getDescricao() {
        return descricao;
    }
}

