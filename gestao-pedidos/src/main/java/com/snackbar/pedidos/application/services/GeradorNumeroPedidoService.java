package com.snackbar.pedidos.application.services;

import com.snackbar.pedidos.domain.valueobjects.NumeroPedido;
import com.snackbar.pedidos.infrastructure.persistence.NumeroPedidoSequenceEntity;
import com.snackbar.pedidos.infrastructure.persistence.NumeroPedidoSequenceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Serviço para geração de número de pedido com atomicidade garantida.
 * 
 * SOLUÇÃO IMPLEMENTADA:
 * Utiliza uma tabela com AUTO_INCREMENT para gerar números únicos
 * de forma atômica no banco de dados. Isso elimina race conditions
 * que ocorriam com a abordagem anterior (MAX+1).
 * 
 * VANTAGENS:
 * - Atomicidade garantida pelo banco de dados
 * - Sem necessidade de retry por duplicação
 * - Performance superior em alta concorrência
 * - Números sempre sequenciais sem gaps (exceto rollbacks)
 * 
 * @see NumeroPedido
 * @see NumeroPedidoSequenceEntity
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class GeradorNumeroPedidoService {

    private final NumeroPedidoSequenceRepository sequenceRepository;

    /**
     * Gera o próximo número de pedido usando sequence do banco.
     * 
     * A geração é feita em uma nova transação (REQUIRES_NEW) para garantir
     * que o número seja commitado imediatamente, independente da transação
     * principal do pedido.
     * 
     * @return NumeroPedido único e sequencial
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public NumeroPedido gerarProximoNumero() {
        NumeroPedidoSequenceEntity sequence = new NumeroPedidoSequenceEntity();
        NumeroPedidoSequenceEntity saved = sequenceRepository.save(sequence);

        int numeroGerado = saved.getId().intValue();
        NumeroPedido numeroPedido = NumeroPedido.de(numeroGerado);

        log.debug("[SEQUENCE] Gerado número de pedido: {} (sequence_id={})",
                numeroPedido.getNumero(), saved.getId());

        return numeroPedido;
    }
}
