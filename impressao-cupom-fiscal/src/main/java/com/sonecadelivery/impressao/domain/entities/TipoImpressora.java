package com.sonecadelivery.impressao.domain.entities;

/**
 * Tipos de impressoras térmicas suportadas.
 * Cada tipo pode ter comandos ESC/POS ligeiramente diferentes.
 * Use GENERICA_ESCPOS para impressoras não listadas.
 */
public enum TipoImpressora {
    // Epson (padrão ESC/POS)
    EPSON_TM_T20("EPSON TM-T20"),
    EPSON_TM_T88("EPSON TM-T88"),

    // Daruma
    DARUMA_800("DARUMA DR-800"),
    DARUMA_700("DARUMA DR-700"),

    // Diebold Nixdorf
    DIEBOLD_IM693H("Diebold Nixdorf IM-693H"),

    // Star
    STAR_TSP100("Star TSP100"),
    STAR_TSP650("Star TSP650"),

    // Bematech
    BEMATECH_MP4200("Bematech MP-4200"),

    // Elgin
    ELGIN_I9("Elgin i9"),
    ELGIN_I7("Elgin i7"),

    // Genéricas (chinesas/POS-58)
    POS_58("POS-58 (Genérica 58mm)"),
    POS_80("POS-80 (Genérica 80mm)"),
    GENERICA_ESCPOS("Genérica ESC/POS");

    private final String descricao;

    TipoImpressora(String descricao) {
        this.descricao = descricao;
    }

    public String getDescricao() {
        return descricao;
    }
}
