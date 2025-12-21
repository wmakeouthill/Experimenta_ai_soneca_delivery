package com.sonecadelivery.orquestrador.application.ports;

import com.sonecadelivery.orquestrador.domain.entities.ConfigAnimacao;
import org.springframework.lang.NonNull;

import java.util.Optional;

public interface ConfigAnimacaoRepositoryPort {
    @NonNull
    ConfigAnimacao salvar(@NonNull ConfigAnimacao config);
    Optional<ConfigAnimacao> buscar();
}

