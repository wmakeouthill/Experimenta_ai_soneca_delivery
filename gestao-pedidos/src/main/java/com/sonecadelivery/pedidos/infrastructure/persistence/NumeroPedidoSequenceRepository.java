package com.sonecadelivery.pedidos.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

/**
 * Repository para gerenciar sequence de número de pedido.
 * 
 * A inserção nesta tabela gera um ID único via AUTO_INCREMENT,
 * garantindo atomicidade mesmo em cenários de alta concorrência.
 * 
 * @see NumeroPedidoSequenceEntity
 */
@Repository
public interface NumeroPedidoSequenceRepository extends JpaRepository<NumeroPedidoSequenceEntity, Long> {

    /**
     * Remove registros antigos da tabela de sequence para evitar crescimento
     * infinito.
     * Mantém apenas os últimos 1000 registros para histórico.
     * 
     * @param keepCount Quantidade de registros mais recentes a manter
     */
    @Modifying
    @Query(value = """
            DELETE FROM numero_pedido_sequence
            WHERE id NOT IN (
                SELECT id FROM (
                    SELECT id FROM numero_pedido_sequence
                    ORDER BY id DESC
                    LIMIT :keepCount
                ) AS recent
            )
            """, nativeQuery = true)
    void deleteOldEntries(int keepCount);
}
