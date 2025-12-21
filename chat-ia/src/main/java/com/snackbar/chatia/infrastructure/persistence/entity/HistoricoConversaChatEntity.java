package com.snackbar.chatia.infrastructure.persistence.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entidade JPA para persistir o histórico de conversas do chat.
 * Cada registro representa uma conversa completa de um cliente.
 */
@Entity
@Table(name = "historico_conversas_chat", indexes = {
    @Index(name = "idx_historico_chat_cliente_id", columnList = "cliente_id"),
    @Index(name = "idx_historico_chat_data_ultima_mensagem", columnList = "data_ultima_mensagem")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HistoricoConversaChatEntity {
    
    @Id
    @Column(length = 36)
    private String id;
    
    @Column(name = "cliente_id", nullable = false, length = 255)
    private String clienteId;
    
    @Column(name = "session_id", nullable = false, length = 255)
    private String sessionId;
    
    @PrePersist
    protected void prePersist() {
        if (id == null) {
            id = UUID.randomUUID().toString();
        }
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        updatedAt = LocalDateTime.now();
    }
    
    @Column(nullable = false, length = 100)
    private String titulo;
    
    @Column(name = "preview_ultima_mensagem", length = 200)
    private String previewUltimaMensagem;
    
    /**
     * Mensagens armazenadas como JSON.
     * Formato: [{"id": "...", "from": "user|assistant", "text": "...", "timestamp": "..."}]
     */
    @Column(columnDefinition = "TEXT", nullable = false)
    private String mensagens;
    
    @Column(name = "data_inicio", nullable = false)
    private LocalDateTime dataInicio;
    
    @Column(name = "data_ultima_mensagem", nullable = false)
    private LocalDateTime dataUltimaMensagem;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
