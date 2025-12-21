package com.sonecadelivery.impressao.domain.valueobjects;

import com.sonecadelivery.impressao.domain.entities.TipoImpressora;

public record DadosConfiguracaoImpressora(
        TipoImpressora tipoImpressora,
        String devicePath,
        String nomeEstabelecimento,
        String enderecoEstabelecimento,
        String telefoneEstabelecimento,
        String cnpjEstabelecimento,
        String logoBase64,
        Integer larguraPapel,
        TamanhoFonteCupom tamanhoFonte) {
}


