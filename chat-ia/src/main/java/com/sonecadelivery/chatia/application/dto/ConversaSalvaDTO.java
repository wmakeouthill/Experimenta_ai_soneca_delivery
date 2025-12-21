package com.sonecadelivery.chatia.application.dto;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO de resposta com os dados de uma conversa salva.
 */
public record ConversaSalvaDTO(
    String id,
    String sessionId,
    String titulo,
    String previewUltimaMensagem,
    LocalDateTime dataInicio,
    LocalDateTime dataUltimaMensagem,
    List<MensagemConversaDTO> mensagens
) {}
