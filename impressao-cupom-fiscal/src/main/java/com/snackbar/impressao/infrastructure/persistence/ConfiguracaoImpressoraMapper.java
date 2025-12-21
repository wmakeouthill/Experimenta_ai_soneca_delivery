package com.snackbar.impressao.infrastructure.persistence;

import com.snackbar.impressao.domain.entities.ConfiguracaoImpressoraEntity;
import com.snackbar.impressao.domain.valueobjects.DadosConfiguracaoImpressora;

import java.util.List;

public class ConfiguracaoImpressoraMapper {

    private ConfiguracaoImpressoraMapper() {
        // Classe utilitária - não deve ser instanciada
    }

    public static ConfiguracaoImpressoraJpaEntity paraEntity(ConfiguracaoImpressoraEntity domain) {
        if (domain == null) {
            return null;
        }

        return ConfiguracaoImpressoraJpaEntity.builder()
                .id(domain.getId())
                .tipoImpressora(domain.getTipoImpressora())
                .devicePath(domain.getDevicePath())
                .nomeEstabelecimento(domain.getNomeEstabelecimento())
                .enderecoEstabelecimento(domain.getEnderecoEstabelecimento())
                .telefoneEstabelecimento(domain.getTelefoneEstabelecimento())
                .cnpjEstabelecimento(domain.getCnpjEstabelecimento())
                .logoBase64(domain.getLogoBase64())
                .logoEscPos(domain.getLogoEscPos())
                .larguraPapel(domain.getLarguraPapel())
                .tamanhoFonte(domain.getTamanhoFonte())
                .ativa(domain.isAtiva())
                .createdAt(domain.getCreatedAt())
                .updatedAt(domain.getUpdatedAt())
                .build();
    }

    public static ConfiguracaoImpressoraEntity paraDomain(ConfiguracaoImpressoraJpaEntity entity) {
        if (entity == null) {
            return null;
        }

        DadosConfiguracaoImpressora dados = new DadosConfiguracaoImpressora(
                entity.getTipoImpressora(),
                entity.getDevicePath(),
                entity.getNomeEstabelecimento(),
                entity.getEnderecoEstabelecimento(),
                entity.getTelefoneEstabelecimento(),
                entity.getCnpjEstabelecimento(),
                entity.getLogoBase64(),
                entity.getLarguraPapel(),
                entity.getTamanhoFonte());

        ConfiguracaoImpressoraEntity domain = ConfiguracaoImpressoraEntity.criar(dados);

        domain.restaurarDoBanco(
                entity.getId(),
                entity.getCreatedAt(),
                entity.getUpdatedAt());

        domain.restaurarLogoEscPos(entity.getLogoEscPos());
        domain.restaurarEstadoAtivo(entity.isAtiva());

        return domain;
    }

    public static List<ConfiguracaoImpressoraEntity> paraDomainList(List<ConfiguracaoImpressoraJpaEntity> entities) {
        return entities.stream()
                .map(ConfiguracaoImpressoraMapper::paraDomain)
                .toList();
    }
}
