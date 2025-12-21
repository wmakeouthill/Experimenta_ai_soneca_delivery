package com.sonecadelivery.pedidos.infrastructure.idempotency;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Scheduler para limpeza periódica de chaves de idempotência expiradas.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class IdempotencyCleanupScheduler {

    private final IdempotencyKeyRepository idempotencyKeyRepository;

    /**
     * Executa limpeza de chaves expiradas a cada hora.
     */
    @Scheduled(fixedRate = 3600000) // 1 hora em milissegundos
    @Transactional
    public void cleanupExpiredKeys() {
        try {
            long countBefore = idempotencyKeyRepository.count();
            idempotencyKeyRepository.deleteExpiredKeys(java.time.LocalDateTime.now());
            long countAfter = idempotencyKeyRepository.count();
            long deleted = countBefore - countAfter;

            if (deleted > 0) {
                log.info("[IDEMPOTENCY_CLEANUP] Removidas {} chaves expiradas", deleted);
            }
        } catch (Exception e) {
            log.error("[IDEMPOTENCY_CLEANUP] Erro ao limpar chaves expiradas", e);
        }
    }
}
