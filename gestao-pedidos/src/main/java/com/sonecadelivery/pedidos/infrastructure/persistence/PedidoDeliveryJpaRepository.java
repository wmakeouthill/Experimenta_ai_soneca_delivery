package com.sonecadelivery.pedidos.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository JPA para pedidos de delivery.
 */
@Repository
public interface PedidoDeliveryJpaRepository extends JpaRepository<PedidoDeliveryEntity, String> {

    /**
     * Busca pedido por chave de idempotência.
     * Essencial para evitar duplicidade de pedidos.
     */
    Optional<PedidoDeliveryEntity> findByIdempotencyKey(String idempotencyKey);

    /**
     * Lista pedidos de um cliente específico.
     */
    List<PedidoDeliveryEntity> findByClienteIdOrderByCreatedAtDesc(String clienteId);

    /**
     * Lista pedidos por telefone do cliente.
     */
    List<PedidoDeliveryEntity> findByTelefoneClienteOrderByCreatedAtDesc(String telefoneCliente);

    /**
     * Lista pedidos por status.
     */
    List<PedidoDeliveryEntity> findByStatusOrderByCreatedAtAsc(PedidoDeliveryEntity.StatusPedidoDelivery status);

    /**
     * Lista pedidos por múltiplos status.
     */
    List<PedidoDeliveryEntity> findByStatusInOrderByCreatedAtAsc(
            List<PedidoDeliveryEntity.StatusPedidoDelivery> statuses);

    /**
     * Lista pedidos ativos (não finalizados/cancelados).
     */
    @Query("SELECT p FROM PedidoDeliveryEntity p WHERE p.status NOT IN ('FINALIZADO', 'CANCELADO') ORDER BY p.createdAt ASC")
    List<PedidoDeliveryEntity> findPedidosAtivos();

    /**
     * Lista pedidos de um motoboy específico.
     * Carrega apenas os pedidos. Os relacionamentos (itens, adicionais, meiosPagamento)
     * serão carregados via lazy loading dentro da transação.
     */
    List<PedidoDeliveryEntity> findByMotoboyIdOrderByCreatedAtDesc(String motoboyId);

    /**
     * Lista pedidos criados em um período.
     */
    List<PedidoDeliveryEntity> findByCreatedAtBetweenOrderByCreatedAtDesc(LocalDateTime inicio, LocalDateTime fim);

    /**
     * Conta pedidos do dia para geração de número sequencial.
     */
    @Query("SELECT COUNT(p) FROM PedidoDeliveryEntity p WHERE DATE(p.createdAt) = CURRENT_DATE")
    long countPedidosHoje();

    /**
     * Busca o último número de pedido do dia.
     */
    @Query("SELECT p.numeroPedido FROM PedidoDeliveryEntity p WHERE DATE(p.createdAt) = CURRENT_DATE ORDER BY p.createdAt DESC LIMIT 1")
    Optional<String> findUltimoNumeroPedidoHoje();

    /**
     * Verifica se existe pedido com a chave de idempotência.
     */
    boolean existsByIdempotencyKey(String idempotencyKey);
}
