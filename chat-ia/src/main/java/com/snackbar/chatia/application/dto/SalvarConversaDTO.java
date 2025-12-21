package com.snackbar.chatia.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO para salvar uma conversa no histórico.
 */
public record SalvarConversaDTO(
    @NotBlank(message = "Session ID é obrigatório")
    String sessionId,
    
    @NotBlank(message = "Título é obrigatório")
    @Size(max = 100, message = "Título deve ter no máximo 100 caracteres")
    String titulo,
    
    @Size(max = 200, message = "Preview deve ter no máximo 200 caracteres")
    String previewUltimaMensagem,
    
    @NotNull(message = "Data de início é obrigatória")
    LocalDateTime dataInicio,
    
    @NotNull(message = "Data da última mensagem é obrigatória")
    LocalDateTime dataUltimaMensagem,
    
    @NotNull(message = "Mensagens são obrigatórias")
    List<MensagemConversaDTO> mensagens
) {}
