package com.sonecadelivery.impressao.application.dtos;

import com.sonecadelivery.impressao.domain.entities.TipoImpressora;
import com.sonecadelivery.impressao.domain.valueobjects.TamanhoFonteCupom;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SalvarConfiguracaoImpressoraRequest {
    @NotNull(message = "Tipo de impressora é obrigatório")
    private TipoImpressora tipoImpressora;

    private String devicePath;

    private Integer larguraPapel;

    private TamanhoFonteCupom tamanhoFonte;

    @NotBlank(message = "Nome do estabelecimento é obrigatório")
    private String nomeEstabelecimento;

    private String enderecoEstabelecimento;

    private String telefoneEstabelecimento;

    private String cnpjEstabelecimento;

    private String logoBase64;
}
