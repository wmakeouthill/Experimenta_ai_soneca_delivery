package com.sonecadelivery.orquestrador.infrastructure.persistence;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "config_animacao")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConfigAnimacaoEntity {
    @Id
    @Column(length = 36)
    private String id;
    
    @Column(name = "animacao_ativada", nullable = false)
    private boolean animacaoAtivada;
    
    @Column(name = "intervalo_animacao", nullable = false)
    private int intervaloAnimacao;
    
    @Column(name = "duracao_animacao", nullable = false)
    private int duracaoAnimacao;
    
    @Column(name = "video1_url", columnDefinition = "LONGTEXT")
    private String video1Url;
    
    @Column(name = "video2_url", columnDefinition = "LONGTEXT")
    private String video2Url;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}

