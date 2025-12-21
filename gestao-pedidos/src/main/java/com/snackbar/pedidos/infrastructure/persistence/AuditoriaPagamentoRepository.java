package com.snackbar.pedidos.infrastructure.persistence;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Repository para consulta de auditoria de pagamentos.
 */
@Repository
public interface AuditoriaPagamentoRepository extends JpaRepository<AuditoriaPagamentoEntity, Long> {

    /**
     * Busca registros de auditoria por ID do pedido.
     */
    List<AuditoriaPagamentoEntity> findByPedidoIdOrderByDataHoraDesc(String pedidoId);

    /**
     * Busca registros de auditoria por número do pedido.
     */
    List<AuditoriaPagamentoEntity> findByNumeroPedidoOrderByDataHoraDesc(String numeroPedido);

    /**
     * Busca registros de auditoria por período.
     */
    @Query("SELECT a FROM AuditoriaPagamentoEntity a WHERE a.dataHora BETWEEN :inicio AND :fim ORDER BY a.dataHora DESC")
    Page<AuditoriaPagamentoEntity> findByPeriodo(
            @Param("inicio") LocalDateTime inicio,
            @Param("fim") LocalDateTime fim,
            Pageable pageable);

    /**
     * Busca operações que falharam em um período.
     */
    @Query("SELECT a FROM AuditoriaPagamentoEntity a WHERE a.sucesso = false AND a.dataHora BETWEEN :inicio AND :fim ORDER BY a.dataHora DESC")
    List<AuditoriaPagamentoEntity> findFalhasPorPeriodo(
            @Param("inicio") LocalDateTime inicio,
            @Param("fim") LocalDateTime fim);

    /**
     * Busca registros por sessão de trabalho.
     */
    List<AuditoriaPagamentoEntity> findBySessaoTrabalhoIdOrderByDataHoraDesc(String sessaoTrabalhoId);

    /**
     * Conta operações por tipo em um período.
     */
    @Query("SELECT a.tipoOperacao, COUNT(a) FROM AuditoriaPagamentoEntity a " +
            "WHERE a.dataHora BETWEEN :inicio AND :fim GROUP BY a.tipoOperacao")
    List<Object[]> countByTipoOperacaoPeriodo(
            @Param("inicio") LocalDateTime inicio,
            @Param("fim") LocalDateTime fim);
}
