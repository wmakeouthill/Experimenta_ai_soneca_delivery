package com.sonecadelivery.orquestrador.application.usecases;

import com.sonecadelivery.orquestrador.application.dto.ConfigAnimacaoDTO;
import com.sonecadelivery.orquestrador.application.dto.SalvarConfigAnimacaoRequest;
import com.sonecadelivery.orquestrador.application.ports.ConfigAnimacaoRepositoryPort;
import com.sonecadelivery.orquestrador.domain.entities.ConfigAnimacao;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class SalvarConfigAnimacaoUseCase {
    
    private final ConfigAnimacaoRepositoryPort repository;
    
    public ConfigAnimacaoDTO executar(SalvarConfigAnimacaoRequest request) {
        ConfigAnimacao config = repository.buscar()
            .orElseGet(() -> ConfigAnimacao.criar(
                request.getAnimacaoAtivada(),
                request.getIntervaloAnimacao(),
                request.getDuracaoAnimacao()
            ));
        
        config.atualizar(
            request.getAnimacaoAtivada(),
            request.getIntervaloAnimacao(),
            request.getDuracaoAnimacao(),
            request.getVideo1Url(),
            request.getVideo2Url()
        );
        
        @SuppressWarnings("null")
        ConfigAnimacao salva = repository.salvar(config);
        
        return ConfigAnimacaoDTO.de(salva);
    }
}

