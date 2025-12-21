package com.snackbar.pedidos.infrastructure.persistence;

import com.snackbar.pedidos.domain.entities.StatusPedido;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PedidoJpaRepository extends JpaRepository<PedidoEntity, String> {
        List<PedidoEntity> findByStatus(StatusPedido status);

        List<PedidoEntity> findByClienteId(String clienteId);

        Page<PedidoEntity> findByClienteId(String clienteId, Pageable pageable);

        List<PedidoEntity> findByDataPedidoBetween(LocalDateTime dataInicio, LocalDateTime dataFim);

        List<PedidoEntity> findByStatusAndDataPedidoBetween(StatusPedido status, LocalDateTime dataInicio,
                        LocalDateTime dataFim);

        @Query(value = "SELECT MAX(CAST(numero_pedido AS UNSIGNED)) FROM pedidos WHERE numero_pedido REGEXP '^[0-9]+$'", nativeQuery = true)
        Optional<Integer> findMaxNumeroPedido();

        @Query("SELECT p FROM PedidoEntity p WHERE p.status = :status AND DATE(p.dataPedido) = DATE(:data)")
        List<PedidoEntity> findByStatusAndDataPedido(@Param("status") StatusPedido status,
                        @Param("data") LocalDateTime data);

        @Query("SELECT DISTINCT p FROM PedidoEntity p LEFT JOIN FETCH p.meiosPagamento LEFT JOIN FETCH p.itens WHERE p.sessaoId = :sessaoId ORDER BY p.numeroPedido ASC, p.dataPedido ASC")
        List<PedidoEntity> findBySessaoId(@Param("sessaoId") String sessaoId);

        @Query(value = "SELECT p.* FROM pedidos p " +
                        "LEFT JOIN sessoes_trabalho st ON st.id = p.sessao_id " +
                        "WHERE COALESCE(st.data_inicio, DATE(p.data_pedido)) = :dataInicio " +
                        "AND p.status <> 'CANCELADO' " +
                        "ORDER BY p.numero_pedido ASC, p.data_pedido ASC", nativeQuery = true)
        List<PedidoEntity> findByDataInicioSessao(@Param("dataInicio") java.sql.Date dataInicio);
}
