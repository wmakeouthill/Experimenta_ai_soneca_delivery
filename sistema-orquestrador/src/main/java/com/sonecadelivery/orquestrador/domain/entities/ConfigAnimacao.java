package com.sonecadelivery.orquestrador.domain.entities;

import com.sonecadelivery.kernel.domain.entities.BaseEntity;
import lombok.Getter;

@Getter
public class ConfigAnimacao extends BaseEntity {
    private boolean animacaoAtivada;
    private int intervaloAnimacao;
    private int duracaoAnimacao;
    private String video1Url;
    private String video2Url;
    
    private ConfigAnimacao() {
        super();
    }
    
    public static ConfigAnimacao criar(boolean animacaoAtivada, int intervaloAnimacao, int duracaoAnimacao) {
        ConfigAnimacao config = new ConfigAnimacao();
        config.animacaoAtivada = animacaoAtivada;
        config.intervaloAnimacao = intervaloAnimacao;
        config.duracaoAnimacao = duracaoAnimacao;
        config.video1Url = null;
        config.video2Url = null;
        config.touch();
        return config;
    }
    
    public void atualizar(boolean animacaoAtivada, int intervaloAnimacao, int duracaoAnimacao, String video1Url, String video2Url) {
        this.animacaoAtivada = animacaoAtivada;
        this.intervaloAnimacao = intervaloAnimacao;
        this.duracaoAnimacao = duracaoAnimacao;
        this.video1Url = video1Url;
        this.video2Url = video2Url;
        touch();
    }
    
    public void restaurarDoBanco(String id, java.time.LocalDateTime createdAt, java.time.LocalDateTime updatedAt) {
        restaurarId(id);
        restaurarTimestamps(createdAt, updatedAt);
    }
}

