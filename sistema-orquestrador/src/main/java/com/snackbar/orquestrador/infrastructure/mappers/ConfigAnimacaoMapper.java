package com.snackbar.orquestrador.infrastructure.mappers;

import com.snackbar.orquestrador.domain.entities.ConfigAnimacao;
import com.snackbar.orquestrador.infrastructure.persistence.ConfigAnimacaoEntity;
import com.snackbar.kernel.infrastructure.mappers.Mapper;
import org.springframework.stereotype.Component;

@Component
public class ConfigAnimacaoMapper implements Mapper<ConfigAnimacao, ConfigAnimacaoEntity> {
    
    @Override
    public ConfigAnimacaoEntity paraEntity(ConfigAnimacao config) {
        if (config == null) {
            return null;
        }
        
        return ConfigAnimacaoEntity.builder()
            .id(config.getId())
            .animacaoAtivada(config.isAnimacaoAtivada())
            .intervaloAnimacao(config.getIntervaloAnimacao())
            .duracaoAnimacao(config.getDuracaoAnimacao())
            .video1Url(config.getVideo1Url())
            .video2Url(config.getVideo2Url())
            .createdAt(config.getCreatedAt())
            .updatedAt(config.getUpdatedAt())
            .build();
    }
    
    @Override
    public ConfigAnimacao paraDomain(ConfigAnimacaoEntity entity) {
        if (entity == null) {
            return null;
        }
        
        ConfigAnimacao config = ConfigAnimacao.criar(
            entity.isAnimacaoAtivada(),
            entity.getIntervaloAnimacao(),
            entity.getDuracaoAnimacao()
        );
        
        config.atualizar(
            entity.isAnimacaoAtivada(),
            entity.getIntervaloAnimacao(),
            entity.getDuracaoAnimacao(),
            entity.getVideo1Url(),
            entity.getVideo2Url()
        );
        
        config.restaurarDoBanco(entity.getId(), entity.getCreatedAt(), entity.getUpdatedAt());
        
        return config;
    }
}

