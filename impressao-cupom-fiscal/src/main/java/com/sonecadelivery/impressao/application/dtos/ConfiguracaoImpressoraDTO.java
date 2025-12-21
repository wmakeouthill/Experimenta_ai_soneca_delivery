package com.sonecadelivery.impressao.application.dtos;

import com.sonecadelivery.impressao.domain.entities.ConfiguracaoImpressoraEntity;
import com.sonecadelivery.impressao.domain.entities.TipoImpressora;
import com.sonecadelivery.impressao.domain.valueobjects.TamanhoFonteCupom;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConfiguracaoImpressoraDTO {
    private String id;
    private TipoImpressora tipoImpressora;
    private String devicePath;
    private Integer larguraPapel;
    private TamanhoFonteCupom tamanhoFonte;
    private String nomeEstabelecimento;
    private String enderecoEstabelecimento;
    private String telefoneEstabelecimento;
    private String cnpjEstabelecimento;
    private String logoBase64;
    private boolean ativa;

    public static ConfiguracaoImpressoraDTO de(ConfiguracaoImpressoraEntity config) {
        return ConfiguracaoImpressoraDTO.builder()
                .id(config.getId())
                .tipoImpressora(config.getTipoImpressora())
                .devicePath(config.getDevicePath())
                .larguraPapel(config.getLarguraPapel())
                .tamanhoFonte(config.getTamanhoFonte())
                .nomeEstabelecimento(config.getNomeEstabelecimento())
                .enderecoEstabelecimento(config.getEnderecoEstabelecimento())
                .telefoneEstabelecimento(config.getTelefoneEstabelecimento())
                .cnpjEstabelecimento(config.getCnpjEstabelecimento())
                .logoBase64(config.getLogoBase64())
                .ativa(config.isAtiva())
                .build();
    }
}
