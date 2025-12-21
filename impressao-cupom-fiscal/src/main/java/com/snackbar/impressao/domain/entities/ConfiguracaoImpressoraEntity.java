package com.snackbar.impressao.domain.entities;

import com.snackbar.impressao.domain.valueobjects.DadosConfiguracaoImpressora;
import com.snackbar.impressao.domain.valueobjects.TamanhoFonteCupom;
import com.snackbar.kernel.domain.entities.BaseEntity;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class ConfiguracaoImpressoraEntity extends BaseEntity {
    private TipoImpressora tipoImpressora;
    private String devicePath;
    private String nomeEstabelecimento;
    private String enderecoEstabelecimento;
    private String telefoneEstabelecimento;
    private String cnpjEstabelecimento;
    private String logoBase64;
    private byte[] logoEscPos;
    private Integer larguraPapel;
    private TamanhoFonteCupom tamanhoFonte;
    private boolean ativa;

    private ConfiguracaoImpressoraEntity() {
        super();
        this.ativa = true;
    }

    public static ConfiguracaoImpressoraEntity criar(DadosConfiguracaoImpressora dados) {
        validarDados(dados.tipoImpressora(), dados.nomeEstabelecimento());

        ConfiguracaoImpressoraEntity config = new ConfiguracaoImpressoraEntity();
        config.aplicarDados(dados);
        config.touch();
        return config;
    }

    public void atualizar(DadosConfiguracaoImpressora dados) {
        validarDados(dados.tipoImpressora(), dados.nomeEstabelecimento());
        aplicarDados(dados);
        touch();
    }

    private void aplicarDados(DadosConfiguracaoImpressora dados) {
        this.tipoImpressora = dados.tipoImpressora();
        this.devicePath = dados.devicePath();
        this.nomeEstabelecimento = dados.nomeEstabelecimento();
        this.enderecoEstabelecimento = dados.enderecoEstabelecimento();
        this.telefoneEstabelecimento = dados.telefoneEstabelecimento();
        this.cnpjEstabelecimento = dados.cnpjEstabelecimento();
        this.logoBase64 = dados.logoBase64();
        this.logoEscPos = converterLogoParaEscPos(dados.logoBase64());
        this.larguraPapel = dados.larguraPapel();
        this.tamanhoFonte = dados.tamanhoFonte();
    }

    private static byte[] converterLogoParaEscPos(String logoBase64) {
        if (logoBase64 == null || logoBase64.trim().isEmpty()) {
            return new byte[0];
        }
        return com.snackbar.impressao.infrastructure.impressora.ImagemEscPosUtil.converterBase64ParaEscPos(logoBase64);
    }

    public void ativar() {
        this.ativa = true;
        touch();
    }

    public void desativar() {
        this.ativa = false;
        touch();
    }

    public void restaurarEstadoAtivo(boolean ativa) {
        this.ativa = ativa;
    }

    public void restaurarLogoEscPos(byte[] logoEscPos) {
        this.logoEscPos = logoEscPos;
    }

    public void restaurarDoBanco(String id, LocalDateTime createdAt, LocalDateTime updatedAt) {
        restaurarId(id);
        restaurarTimestamps(createdAt, updatedAt);
    }

    private static void validarDados(TipoImpressora tipoImpressora, String nomeEstabelecimento) {
        if (tipoImpressora == null) {
            throw new IllegalArgumentException("Tipo de impressora não pode ser nulo");
        }
        if (nomeEstabelecimento == null || nomeEstabelecimento.trim().isEmpty()) {
            throw new IllegalArgumentException("Nome do estabelecimento não pode ser nulo ou vazio");
        }
    }
}
