package com.snackbar.chatia.infrastructure.persistence;

import com.snackbar.chatia.domain.entity.MensagemChat;
import com.snackbar.chatia.domain.repository.HistoricoChatRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Implementação do repositório de histórico de chat em memória.
 * Mantém histórico separado por sessão com limpeza automática de sessões antigas.
 */
@Slf4j
@Component
public class HistoricoChatMemoriaRepository implements HistoricoChatRepository {
    
    /**
     * Número máximo de mensagens do histórico a serem enviadas para a IA.
     */
    private static final int MAX_HISTORICO_MENSAGENS = 10;
    
    /**
     * Tempo em minutos para considerar uma sessão como inativa.
     */
    private static final int TTL_SESSAO_MINUTOS = 30;
    
    private final Map<String, List<MensagemChat>> historicoPorSessao = new ConcurrentHashMap<>();
    private final Map<String, LocalDateTime> ultimaAtividadePorSessao = new ConcurrentHashMap<>();
    
    @Override
    public void adicionarMensagem(String sessionId, MensagemChat mensagem) {
        if (sessionId == null || sessionId.isBlank()) {
            log.warn("Tentativa de adicionar mensagem sem sessionId - ignorando");
            return;
        }
        
        atualizarAtividade(sessionId);
        
        List<MensagemChat> historico = historicoPorSessao.computeIfAbsent(
            sessionId, 
            k -> Collections.synchronizedList(new ArrayList<>())
        );
        
        historico.add(mensagem);
        log.debug("Mensagem adicionada ao histórico da sessão {} (total: {})", sessionId, historico.size());
    }
    
    @Override
    public List<MensagemChat> obterHistorico(String sessionId) {
        if (sessionId == null || sessionId.isBlank()) {
            log.warn("Tentativa de obter histórico sem sessionId - retornando vazio");
            return new ArrayList<>();
        }
        
        limparSessoesAntigas();
        
        List<MensagemChat> historico = historicoPorSessao.get(sessionId);
        if (historico == null || historico.isEmpty()) {
            return new ArrayList<>();
        }
        
        List<MensagemChat> historicoCompleto = new ArrayList<>(historico);
        
        if (historicoCompleto.size() <= MAX_HISTORICO_MENSAGENS) {
            return historicoCompleto;
        }
        
        return obterUltimasMensagens(historicoCompleto);
    }
    
    @Override
    public void limparHistorico(String sessionId) {
        if (sessionId == null || sessionId.isBlank()) {
            log.warn("Tentativa de limpar histórico sem sessionId - ignorando");
            return;
        }
        
        List<MensagemChat> removido = historicoPorSessao.remove(sessionId);
        ultimaAtividadePorSessao.remove(sessionId);
        
        if (removido != null) {
            log.info("Histórico da sessão {} limpo ({} mensagens removidas)", sessionId, removido.size());
        }
    }
    
    private List<MensagemChat> obterUltimasMensagens(List<MensagemChat> historicoCompleto) {
        int tamanho = historicoCompleto.size();
        int inicio = Math.max(0, tamanho - MAX_HISTORICO_MENSAGENS);
        return new ArrayList<>(historicoCompleto.subList(inicio, tamanho));
    }
    
    private void atualizarAtividade(String sessionId) {
        ultimaAtividadePorSessao.put(sessionId, LocalDateTime.now());
    }
    
    private void limparSessoesAntigas() {
        LocalDateTime agora = LocalDateTime.now();
        List<String> sessoesParaRemover = new ArrayList<>();
        
        for (Map.Entry<String, LocalDateTime> entry : ultimaAtividadePorSessao.entrySet()) {
            String sessionId = entry.getKey();
            LocalDateTime ultimaAtividade = entry.getValue();
            
            if (ultimaAtividade.plusMinutes(TTL_SESSAO_MINUTOS).isBefore(agora)) {
                sessoesParaRemover.add(sessionId);
            }
        }
        
        for (String sessionId : sessoesParaRemover) {
            historicoPorSessao.remove(sessionId);
            ultimaAtividadePorSessao.remove(sessionId);
            log.debug("Sessão {} removida por inatividade", sessionId);
        }
        
        if (!sessoesParaRemover.isEmpty()) {
            log.info("Limpeza automática: {} sessões removidas por inatividade", sessoesParaRemover.size());
        }
    }
}
