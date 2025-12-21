package com.sonecadelivery.chatia.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO para requisição de mensagem ao chat.
 */
public record ChatRequestDTO(
    @NotBlank(message = "Mensagem não pode ser vazia")
    @Size(max = 4000, message = "Mensagem não pode exceder 4000 caracteres")
    String message,
    
    String sessionId,
    
    /** ID do cliente logado, para personalização das respostas */
    String clienteId
) {
    public ChatRequestDTO {
        if (message != null) {
            message = message.trim();
        }
    }
    
    /**
     * Construtor compatível para requests sem clienteId.
     */
    public ChatRequestDTO(String message, String sessionId) {
        this(message, sessionId, null);
    }
}
