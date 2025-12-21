package com.sonecadelivery.pedidos.infrastructure.persistence;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repositório JPA para pedidos pendentes de mesa.
 */
@Repository
public interface PedidoPendenteJpaRepository extends JpaRepository<PedidoPendenteEntity, String> {

    /**
     * Lista pedidos pendentes (sem pedido_real_id) ordenados por data de
     * solicitação.
     */
    @Query("SELECT DISTINCT p FROM PedidoPendenteEntity p " +
            "LEFT JOIN FETCH p.itens " +
            "LEFT JOIN FETCH p.meiosPagamento " +
            "WHERE p.pedidoRealId IS NULL " +
            "ORDER BY p.dataHoraSolicitacao ASC")
    List<PedidoPendenteEntity> findPendentes();

    /**
     * Conta pedidos pendentes na fila.
     */
    @Query("SELECT COUNT(p) FROM PedidoPendenteEntity p WHERE p.pedidoRealId IS NULL")
    long countPendentes();

    /**
     * Busca pedido pendente que ainda não foi aceito.
     */
    @Query("SELECT p FROM PedidoPendenteEntity p " +
            "LEFT JOIN FETCH p.itens " +
            "LEFT JOIN FETCH p.meiosPagamento " +
            "WHERE p.id = :id AND p.pedidoRealId IS NULL")
    Optional<PedidoPendenteEntity> findPendenteById(@Param("id") String id);

    /**
     * Busca pedido pendente COM LOCK para garantir que apenas uma transação
     * consiga aceitar o mesmo pedido (evita race condition).
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM PedidoPendenteEntity p " +
            "LEFT JOIN FETCH p.itens " +
            "LEFT JOIN FETCH p.meiosPagamento " +
            "WHERE p.id = :id AND p.pedidoRealId IS NULL")
    Optional<PedidoPendenteEntity> findPendenteByIdComLock(@Param("id") String id);

    /**
     * Busca o ID do pedido real associado a um pedido pendente.
     */
    @Query("SELECT p.pedidoRealId FROM PedidoPendenteEntity p WHERE p.id = :pedidoPendenteId")
    Optional<String> findPedidoRealIdByPendenteId(@Param("pedidoPendenteId") String pedidoPendenteId);

    /**
     * Remove pedidos expirados (mais antigos que o limite especificado).
     * Retorna a quantidade de registros removidos.
     */
    @Modifying
    @Query("DELETE FROM PedidoPendenteEntity p WHERE p.pedidoRealId IS NULL AND p.dataHoraSolicitacao < :limite")
    int deleteExpirados(@Param("limite") LocalDateTime limite);

    /**
     * Atualiza o pedidoRealId quando o pedido é aceito.
     */
    @Modifying
    @Query("UPDATE PedidoPendenteEntity p SET p.pedidoRealId = :pedidoRealId, p.updatedAt = CURRENT_TIMESTAMP WHERE p.id = :pedidoPendenteId")
    int marcarComoAceito(@Param("pedidoPendenteId") String pedidoPendenteId,
            @Param("pedidoRealId") String pedidoRealId);
}
