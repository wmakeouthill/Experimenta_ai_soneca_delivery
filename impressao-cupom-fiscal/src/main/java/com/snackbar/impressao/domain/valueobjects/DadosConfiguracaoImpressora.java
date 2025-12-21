package com.snackbar.impressao.domain.valueobjects;

import com.snackbar.impressao.domain.entities.TipoImpressora;

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


