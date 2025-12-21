package com.sonecadelivery.pedidos.infrastructure.scheduler;

import com.sonecadelivery.pedidos.infrastructure.persistence.NumeroPedidoSequenceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Scheduler para limpeza periódica de registros antigos da tabela sequence.
 * 
 * A tabela numero_pedido_sequence cresce a cada pedido criado.
 * Este scheduler remove registros antigos, mantendo apenas os mais recentes
 * para evitar crescimento infinito do banco.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class NumeroPedidoSequenceCleanupScheduler {

    private final NumeroPedidoSequenceRepository sequenceRepository;

    /**
     * Quantidade de registros recentes a manter na tabela.
     * Mantém os últimos 1000 para auditoria e debug.
     */
    private static final int REGISTROS_A_MANTER = 1000;

    /**
     * Executa limpeza diariamente às 3h da manhã.
     * Horário escolhido por ser período de baixo movimento.
     */
    @Scheduled(cron = "0 0 3 * * ?")
    @Transactional
    public void limparRegistrosAntigos() {
        try {
            long countAntes = sequenceRepository.count();

            if (countAntes > REGISTROS_A_MANTER) {
                sequenceRepository.deleteOldEntries(REGISTROS_A_MANTER);
                long countDepois = sequenceRepository.count();
                long removidos = countAntes - countDepois;

                log.info(
                        "[SEQUENCE_CLEANUP] Limpeza de sequence concluída: {} registros removidos (antes: {}, depois: {})",
                        removidos, countAntes, countDepois);
            } else {
                log.debug("[SEQUENCE_CLEANUP] Limpeza não necessária: {} registros (limite: {})",
                        countAntes, REGISTROS_A_MANTER);
            }
        } catch (Exception e) {
            log.error("[SEQUENCE_CLEANUP] Erro ao limpar registros antigos da sequence", e);
        }
    }
}
