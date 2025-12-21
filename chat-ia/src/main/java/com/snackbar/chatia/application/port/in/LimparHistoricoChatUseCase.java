package com.snackbar.chatia.application.port.in;

/**
 * Porta de entrada para limpar histórico do chat.
 */
public interface LimparHistoricoChatUseCase {
    
    /**
     * Limpa o histórico de mensagens de uma sessão.
     * 
     * @param sessionId identificador da sessão
     */
    void executar(String sessionId);
}
