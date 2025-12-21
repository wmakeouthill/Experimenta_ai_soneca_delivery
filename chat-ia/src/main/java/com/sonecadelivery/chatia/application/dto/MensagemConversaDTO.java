package com.sonecadelivery.chatia.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

/**
 * DTO para representar uma mensagem dentro de uma conversa.
 */
public record MensagemConversaDTO(
    @NotBlank(message = "ID da mensagem é obrigatório")
    String id,
    
    @NotBlank(message = "Origem da mensagem é obrigatória")
    String from, // "user" ou "assistant"
    
    @NotBlank(message = "Texto da mensagem é obrigatório")
    String text,
    
    @NotNull(message = "Timestamp da mensagem é obrigatório")
    LocalDateTime timestamp
) {}
