package com.sonecadelivery.orquestrador.application.usecases;

import com.sonecadelivery.orquestrador.application.dto.ConfigAnimacaoDTO;
import com.sonecadelivery.orquestrador.application.ports.ConfigAnimacaoRepositoryPort;
import com.sonecadelivery.orquestrador.domain.entities.ConfigAnimacao;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CarregarConfigAnimacaoUseCase {

    private final ConfigAnimacaoRepositoryPort repository;

    public ConfigAnimacaoDTO executar() {
        return repository.buscar()
                .map(ConfigAnimacaoDTO::de)
                .orElseGet(this::criarConfigPadrao);
    }

    private ConfigAnimacaoDTO criarConfigPadrao() {
        ConfigAnimacao configPadrao = ConfigAnimacao.criar(true, 30, 6);
        if (configPadrao == null) {
            throw new IllegalStateException("Configuração padrão não pôde ser criada");
        }
        ConfigAnimacao salva = repository.salvar(configPadrao);
        return ConfigAnimacaoDTO.de(salva);
    }
}
