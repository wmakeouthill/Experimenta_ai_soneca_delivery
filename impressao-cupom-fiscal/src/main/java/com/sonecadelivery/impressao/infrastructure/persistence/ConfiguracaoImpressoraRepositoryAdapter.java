package com.sonecadelivery.impressao.infrastructure.persistence;

import com.sonecadelivery.impressao.application.ports.ConfiguracaoImpressoraRepositoryPort;
import com.sonecadelivery.impressao.domain.entities.ConfiguracaoImpressoraEntity;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.Objects;

@Component
@RequiredArgsConstructor
public class ConfiguracaoImpressoraRepositoryAdapter implements ConfiguracaoImpressoraRepositoryPort {

    private final ConfiguracaoImpressoraJpaRepository jpaRepository;

    @Override
    @SuppressWarnings("null")
    public ConfiguracaoImpressoraEntity salvar(ConfiguracaoImpressoraEntity config) {
        ConfiguracaoImpressoraJpaEntity entity = ConfiguracaoImpressoraMapper
                .paraEntity(Objects.requireNonNull(config));
        ConfiguracaoImpressoraJpaEntity salva = jpaRepository.save(entity);
        return ConfiguracaoImpressoraMapper.paraDomain(salva);
    }

    @Override
    public Optional<ConfiguracaoImpressoraEntity> buscarAtiva() {
        return jpaRepository.findByAtivaTrue()
                .map(ConfiguracaoImpressoraMapper::paraDomain);
    }

    @Override
    public Optional<ConfiguracaoImpressoraEntity> buscarPorId(String id) {
        return jpaRepository.findById(Objects.requireNonNull(id))
                .map(ConfiguracaoImpressoraMapper::paraDomain);
    }

    @Override
    public List<ConfiguracaoImpressoraEntity> buscarTodas() {
        return ConfiguracaoImpressoraMapper.paraDomainList(jpaRepository.findAll());
    }
}
