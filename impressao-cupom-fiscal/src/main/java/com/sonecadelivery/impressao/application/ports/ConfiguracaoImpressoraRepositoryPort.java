package com.sonecadelivery.impressao.application.ports;

import com.sonecadelivery.impressao.domain.entities.ConfiguracaoImpressoraEntity;

import java.util.List;
import java.util.Optional;

public interface ConfiguracaoImpressoraRepositoryPort {
    ConfiguracaoImpressoraEntity salvar(ConfiguracaoImpressoraEntity config);
    Optional<ConfiguracaoImpressoraEntity> buscarAtiva();
    Optional<ConfiguracaoImpressoraEntity> buscarPorId(String id);
    List<ConfiguracaoImpressoraEntity> buscarTodas();
}

