package com.snackbar.chatia.application.usecase;

import com.snackbar.chatia.application.port.in.LimparHistoricoChatUseCase;
import com.snackbar.chatia.domain.repository.HistoricoChatRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Caso de uso para limpar histórico do chat.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class LimparHistoricoChatUseCaseImpl implements LimparHistoricoChatUseCase {
    
    private final HistoricoChatRepository historicoRepository;
    
    @Override
    public void executar(String sessionId) {
        if (sessionId == null || sessionId.isBlank()) {
            log.warn("Tentativa de limpar histórico sem sessionId");
            return;
        }
        
        log.info("Limpando histórico do chat - Session: {}", sessionId);
        historicoRepository.limparHistorico(sessionId);
    }
}
