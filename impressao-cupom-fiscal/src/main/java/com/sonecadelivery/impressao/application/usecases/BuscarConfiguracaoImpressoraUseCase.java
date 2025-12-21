package com.sonecadelivery.impressao.application.usecases;

import com.sonecadelivery.impressao.application.dtos.ConfiguracaoImpressoraDTO;
import com.sonecadelivery.impressao.application.ports.ConfiguracaoImpressoraRepositoryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class BuscarConfiguracaoImpressoraUseCase {
    
    private final ConfiguracaoImpressoraRepositoryPort repository;
    
    public ConfiguracaoImpressoraDTO executar() {
        return repository.buscarAtiva()
                .map(ConfiguracaoImpressoraDTO::de)
                .orElse(null);
    }
}

