package com.snackbar.kernel.domain.entities;

import lombok.Getter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
public abstract class BaseEntity {
    private String id;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    protected BaseEntity() {
        this.id = UUID.randomUUID().toString();
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
    
    protected void touch() {
        this.updatedAt = LocalDateTime.now();
    }
    
    /**
     * Restaura o ID da entidade (usado ao carregar do banco de dados).
     * @param id ID a ser restaurado
     */
    protected void restaurarId(String id) {
        if (id != null && !id.isEmpty()) {
            this.id = id;
        }
    }
    
    /**
     * Restaura os timestamps da entidade (usado ao carregar do banco de dados).
     * @param createdAt Data de criação
     * @param updatedAt Data de atualização
     */
    protected void restaurarTimestamps(LocalDateTime createdAt, LocalDateTime updatedAt) {
        if (createdAt != null) {
            this.createdAt = createdAt;
        }
        if (updatedAt != null) {
            this.updatedAt = updatedAt;
        }
    }
}

