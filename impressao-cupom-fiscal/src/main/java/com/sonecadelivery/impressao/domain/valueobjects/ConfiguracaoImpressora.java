package com.sonecadelivery.impressao.domain.valueobjects;

import com.sonecadelivery.impressao.domain.entities.TipoImpressora;
import lombok.Getter;

@Getter
public class ConfiguracaoImpressora {
    private final TipoImpressora tipoImpressora;
    private final String nomeImpressora;
    private final String devicePath;
    private final int larguraPapel;
    private final String encoding;
    
    private ConfiguracaoImpressora(TipoImpressora tipoImpressora, String nomeImpressora, String devicePath, int larguraPapel, String encoding) {
        this.tipoImpressora = tipoImpressora;
        this.nomeImpressora = nomeImpressora;
        this.devicePath = devicePath;
        this.larguraPapel = larguraPapel;
        this.encoding = encoding;
    }
    
    public static ConfiguracaoImpressora criar(TipoImpressora tipoImpressora, String nomeImpressora, String devicePath, int larguraPapel, String encoding) {
        validarDados(tipoImpressora, nomeImpressora, larguraPapel, encoding);
        return new ConfiguracaoImpressora(tipoImpressora, nomeImpressora, devicePath, larguraPapel, encoding);
    }
    
    public static ConfiguracaoImpressora padraoEpson() {
        return criar(TipoImpressora.EPSON_TM_T20, "EPSON TM-T20", null, 80, "UTF-8");
    }
    
    public static ConfiguracaoImpressora padraoDaruma() {
        return criar(TipoImpressora.DARUMA_800, "DARUMA DR-800", null, 80, "UTF-8");
    }
    
    private static void validarDados(TipoImpressora tipoImpressora, String nomeImpressora, int larguraPapel, String encoding) {
        if (tipoImpressora == null) {
            throw new IllegalArgumentException("Tipo de impressora não pode ser nulo");
        }
        if (nomeImpressora == null || nomeImpressora.trim().isEmpty()) {
            throw new IllegalArgumentException("Nome da impressora não pode ser nulo ou vazio");
        }
        if (larguraPapel <= 0) {
            throw new IllegalArgumentException("Largura do papel deve ser maior que zero");
        }
        if (encoding == null || encoding.trim().isEmpty()) {
            throw new IllegalArgumentException("Encoding não pode ser nulo ou vazio");
        }
    }
}

