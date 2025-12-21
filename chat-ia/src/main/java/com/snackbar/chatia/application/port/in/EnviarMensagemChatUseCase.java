package com.snackbar.chatia.application.port.in;

import com.snackbar.chatia.application.dto.ChatRequestDTO;
import com.snackbar.chatia.application.dto.ChatResponseDTO;

/**
 * Porta de entrada para envio de mensagens ao chat IA.
 */
public interface EnviarMensagemChatUseCase {
    
    /**
     * Processa uma mensagem do usuário e retorna a resposta da IA.
     * 
     * @param request DTO com a mensagem e sessionId
     * @return resposta da IA
     */
    ChatResponseDTO executar(ChatRequestDTO request);
}
