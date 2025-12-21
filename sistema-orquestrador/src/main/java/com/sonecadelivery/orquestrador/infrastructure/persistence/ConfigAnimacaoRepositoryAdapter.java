package com.sonecadelivery.orquestrador.infrastructure.persistence;

import com.sonecadelivery.orquestrador.application.ports.ConfigAnimacaoRepositoryPort;
import com.sonecadelivery.orquestrador.domain.entities.ConfigAnimacao;
import com.sonecadelivery.orquestrador.infrastructure.mappers.ConfigAnimacaoMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;

import java.util.Objects;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class ConfigAnimacaoRepositoryAdapter implements ConfigAnimacaoRepositoryPort {

    private final ConfigAnimacaoJpaRepository jpaRepository;
    private final ConfigAnimacaoMapper mapper;

    @Override
    @NonNull
    public ConfigAnimacao salvar(@NonNull ConfigAnimacao config) {
        ConfigAnimacaoEntity entity = Objects.requireNonNull(
                mapper.paraEntity(config),
                "Configuração de animação não pôde ser convertida para entidade");
        ConfigAnimacaoEntity salva = Objects.requireNonNull(
                jpaRepository.save(entity),
                "Configuração de animação não pôde ser persistida");
        return Objects.requireNonNull(
                mapper.paraDomain(salva),
                "Configuração de animação persistida não pôde ser convertida para domínio");
    }

    @Override
    public Optional<ConfigAnimacao> buscar() {
        return jpaRepository.findFirstByOrderByCreatedAtAsc()
                .map(mapper::paraDomain);
    }
}
