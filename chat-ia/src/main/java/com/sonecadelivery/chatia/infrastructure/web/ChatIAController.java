package com.sonecadelivery.chatia.infrastructure.web;

import com.sonecadelivery.chatia.application.dto.ChatRequestDTO;
import com.sonecadelivery.chatia.application.dto.ChatResponseDTO;
import com.sonecadelivery.chatia.application.port.in.EnviarMensagemChatUseCase;
import com.sonecadelivery.chatia.application.port.in.LimparHistoricoChatUseCase;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controller REST para o Chat IA.
 */
@Slf4j
@RestController
@RequestMapping("/api/chat-ia")
@RequiredArgsConstructor
public class ChatIAController {
    
    private final EnviarMensagemChatUseCase enviarMensagemUseCase;
    private final LimparHistoricoChatUseCase limparHistoricoUseCase;
    
    /**
     * Envia uma mensagem para o chat e recebe a resposta da IA.
     * 
     * @param request corpo da requisição com a mensagem
     * @param sessionId identificador da sessão (header opcional)
     * @return resposta da IA
     */
    @PostMapping
    public ResponseEntity<ChatResponseDTO> enviarMensagem(
            @Valid @RequestBody ChatRequestDTO request,
            @RequestHeader(value = "X-Session-ID", required = false) String sessionId) {
        
        log.info("Recebida mensagem do chat - Session: {}, Cliente: {}", sessionId, request.clienteId());
        
        // Usa sessionId do header se não vier no body
        ChatRequestDTO requestComSession = new ChatRequestDTO(
            request.message(),
            request.sessionId() != null ? request.sessionId() : sessionId,
            request.clienteId()
        );
        
        ChatResponseDTO response = enviarMensagemUseCase.executar(requestComSession);
        return ResponseEntity.ok(response);
    }
    
    /**
     * Limpa o histórico de mensagens da sessão.
     * 
     * @param sessionId identificador da sessão (header)
     * @return 204 No Content
     */
    @PostMapping("/clear")
    public ResponseEntity<Void> limparHistorico(
            @RequestHeader(value = "X-Session-ID", required = false) String sessionId) {
        
        log.info("Solicitação para limpar histórico - Session: {}", sessionId);
        limparHistoricoUseCase.executar(sessionId);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Health check do serviço de chat.
     */
    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Chat IA service is running");
    }
}
