package com.snackbar.orquestrador.application.dto;

import com.snackbar.kernel.application.dto.BaseDTO;
import com.snackbar.orquestrador.domain.entities.ConfigAnimacao;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.SuperBuilder;

@Data
@SuperBuilder
@EqualsAndHashCode(callSuper = true)
public class ConfigAnimacaoDTO extends BaseDTO {
    private boolean animacaoAtivada;
    private int intervaloAnimacao;
    private int duracaoAnimacao;
    private String video1Url;
    private String video2Url;
    
    public static ConfigAnimacaoDTO de(ConfigAnimacao config) {
        return ConfigAnimacaoDTO.builder()
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
}

