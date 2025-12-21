package com.snackbar.chatia.infrastructure.web;

import com.snackbar.chatia.application.dto.ConversaSalvaDTO;
import com.snackbar.chatia.application.dto.SalvarConversaDTO;
import com.snackbar.chatia.application.service.HistoricoConversaChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller REST para gerenciar o histórico de conversas do chat.
 */
@Slf4j
@RestController
@RequestMapping("/api/chat-ia/historico")
@RequiredArgsConstructor
public class HistoricoConversaChatController {
    
    private final HistoricoConversaChatService historicoService;
    
    /**
     * Lista as últimas conversas de um cliente.
     * 
     * @param clienteId ID do cliente
     * @return lista de conversas
     */
    @GetMapping("/{clienteId}")
    public ResponseEntity<List<ConversaSalvaDTO>> listarConversas(@PathVariable String clienteId) {
        log.info("GET /api/chat-ia/historico/{} - Listando conversas", clienteId);
        
        List<ConversaSalvaDTO> conversas = historicoService.listarConversas(clienteId);
        return ResponseEntity.ok(conversas);
    }
    
    /**
     * Salva uma nova conversa no histórico.
     * 
     * @param clienteId ID do cliente
     * @param dto dados da conversa
     * @return conversa salva
     */
    @PostMapping("/{clienteId}")
    public ResponseEntity<ConversaSalvaDTO> salvarConversa(
            @PathVariable String clienteId,
            @Valid @RequestBody SalvarConversaDTO dto) {
        
        log.info("POST /api/chat-ia/historico/{} - Salvando conversa: {}", clienteId, dto.titulo());
        
        ConversaSalvaDTO conversaSalva = historicoService.salvarConversa(clienteId, dto);
        return ResponseEntity.ok(conversaSalva);
    }
    
    /**
     * Busca uma conversa específica.
     * 
     * @param clienteId ID do cliente
     * @param conversaId ID da conversa
     * @return conversa encontrada ou 404
     */
    @GetMapping("/{clienteId}/{conversaId}")
    public ResponseEntity<ConversaSalvaDTO> buscarConversa(
            @PathVariable String clienteId,
            @PathVariable String conversaId) {
        
        log.info("GET /api/chat-ia/historico/{}/{} - Buscando conversa", clienteId, conversaId);
        
        ConversaSalvaDTO conversa = historicoService.buscarConversa(clienteId, conversaId);
        if (conversa == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(conversa);
    }
    
    /**
     * Remove uma conversa do histórico.
     * 
     * @param clienteId ID do cliente
     * @param conversaId ID da conversa
     * @return 204 se removido, 404 se não encontrado
     */
    @DeleteMapping("/{clienteId}/{conversaId}")
    public ResponseEntity<Void> removerConversa(
            @PathVariable String clienteId,
            @PathVariable String conversaId) {
        
        log.info("DELETE /api/chat-ia/historico/{}/{} - Removendo conversa", clienteId, conversaId);
        
        boolean removido = historicoService.removerConversa(clienteId, conversaId);
        if (!removido) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.noContent().build();
    }
}
