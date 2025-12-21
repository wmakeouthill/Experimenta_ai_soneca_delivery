package com.snackbar.chatia.domain.repository;

import com.snackbar.chatia.domain.entity.MensagemChat;
import java.util.List;

/**
 * Interface de porta para gerenciamento do histórico de chat.
 * Define operações para manipular mensagens por sessão.
 */
public interface HistoricoChatRepository {
    
    /**
     * Adiciona uma mensagem ao histórico da sessão.
     * 
     * @param sessionId identificador da sessão
     * @param mensagem mensagem a ser adicionada
     */
    void adicionarMensagem(String sessionId, MensagemChat mensagem);
    
    /**
     * Obtém o histórico de mensagens da sessão.
     * Retorna apenas as últimas N mensagens para otimização de tokens.
     * 
     * @param sessionId identificador da sessão
     * @return lista de mensagens do histórico
     */
    List<MensagemChat> obterHistorico(String sessionId);
    
    /**
     * Limpa todo o histórico de uma sessão.
     * 
     * @param sessionId identificador da sessão
     */
    void limparHistorico(String sessionId);
}
