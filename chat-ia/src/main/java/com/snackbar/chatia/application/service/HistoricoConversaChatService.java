package com.snackbar.chatia.application.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.snackbar.chatia.application.dto.ConversaSalvaDTO;
import com.snackbar.chatia.application.dto.MensagemConversaDTO;
import com.snackbar.chatia.application.dto.SalvarConversaDTO;
import com.snackbar.chatia.infrastructure.persistence.entity.HistoricoConversaChatEntity;
import com.snackbar.chatia.infrastructure.persistence.repository.HistoricoConversaChatJpaRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Serviço para gerenciar o histórico de conversas do chat.
 */
@Slf4j
@Service
public class HistoricoConversaChatService {
    
    private static final int MAX_CONVERSAS_POR_CLIENTE = 10;
    
    private final HistoricoConversaChatJpaRepository repository;
    private final ObjectMapper objectMapper;
    
    public HistoricoConversaChatService(HistoricoConversaChatJpaRepository repository) {
        this.repository = repository;
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
    }
    
    /**
     * Lista as últimas conversas de um cliente.
     */
    @Transactional(readOnly = true)
    public List<ConversaSalvaDTO> listarConversas(String clienteId) {
        log.info("Listando conversas do cliente: {}", clienteId);
        
        List<HistoricoConversaChatEntity> entities = repository.findTopNByClienteId(clienteId, MAX_CONVERSAS_POR_CLIENTE);
        
        return entities.stream()
            .map(this::toDTO)
            .toList();
    }
    
    /**
     * Salva uma nova conversa no histórico.
     */
    @Transactional
    public ConversaSalvaDTO salvarConversa(String clienteId, SalvarConversaDTO dto) {
        log.info("Salvando conversa para cliente: {} - Título: {}", clienteId, dto.titulo());
        
        // Converte mensagens para JSON
        String mensagensJson;
        try {
            mensagensJson = objectMapper.writeValueAsString(dto.mensagens());
        } catch (JsonProcessingException e) {
            log.error("Erro ao serializar mensagens para JSON", e);
            throw new RuntimeException("Erro ao salvar conversa", e);
        }
        
        HistoricoConversaChatEntity entity = HistoricoConversaChatEntity.builder()
            .clienteId(clienteId)
            .sessionId(dto.sessionId())
            .titulo(dto.titulo())
            .previewUltimaMensagem(dto.previewUltimaMensagem())
            .dataInicio(dto.dataInicio())
            .dataUltimaMensagem(dto.dataUltimaMensagem())
            .mensagens(mensagensJson)
            .build();
        
        entity = repository.save(entity);
        
        // Limpa conversas antigas se exceder o limite
        limparConversasAntigas(clienteId);
        
        log.info("Conversa salva com ID: {}", entity.getId());
        return toDTO(entity);
    }
    
    /**
     * Busca uma conversa específica pelo ID.
     */
    @Transactional(readOnly = true)
    public ConversaSalvaDTO buscarConversa(String clienteId, String conversaId) {
        log.info("Buscando conversa {} do cliente {}", conversaId, clienteId);
        
        return repository.findById(conversaId)
            .filter(entity -> entity.getClienteId().equals(clienteId))
            .map(this::toDTO)
            .orElse(null);
    }
    
    /**
     * Remove uma conversa do histórico.
     */
    @Transactional
    public boolean removerConversa(String clienteId, String conversaId) {
        log.info("Removendo conversa {} do cliente {}", conversaId, clienteId);
        
        if (!repository.existsByIdAndClienteId(conversaId, clienteId)) {
            log.warn("Conversa {} não encontrada ou não pertence ao cliente {}", conversaId, clienteId);
            return false;
        }
        
        repository.deleteByIdAndClienteId(conversaId, clienteId);
        log.info("Conversa {} removida com sucesso", conversaId);
        return true;
    }
    
    /**
     * Remove conversas antigas mantendo apenas as mais recentes.
     */
    private void limparConversasAntigas(String clienteId) {
        long total = repository.countByClienteId(clienteId);
        if (total > MAX_CONVERSAS_POR_CLIENTE) {
            log.info("Cliente {} tem {} conversas, removendo as mais antigas", clienteId, total);
            repository.deleteOldestByClienteId(clienteId, MAX_CONVERSAS_POR_CLIENTE);
        }
    }
    
    /**
     * Converte entity para DTO.
     */
    private ConversaSalvaDTO toDTO(HistoricoConversaChatEntity entity) {
        List<MensagemConversaDTO> mensagens;
        try {
            mensagens = objectMapper.readValue(
                entity.getMensagens(),
                new TypeReference<List<MensagemConversaDTO>>() {}
            );
        } catch (JsonProcessingException e) {
            log.error("Erro ao deserializar mensagens do JSON", e);
            mensagens = List.of();
        }
        
        return new ConversaSalvaDTO(
            entity.getId(),
            entity.getSessionId(),
            entity.getTitulo(),
            entity.getPreviewUltimaMensagem(),
            entity.getDataInicio(),
            entity.getDataUltimaMensagem(),
            mensagens
        );
    }
}
