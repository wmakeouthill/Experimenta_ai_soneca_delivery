package com.sonecadelivery.pedidos.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

/**
 * Repositório JPA para MovimentacaoCaixaEntity.
 * Armazena apenas sangrias e suprimentos.
 */
@Repository
public interface MovimentacaoCaixaJpaRepository extends JpaRepository<MovimentacaoCaixaEntity, String> {

    /**
     * Busca todas as movimentações de uma sessão, ordenadas por data.
     */
    List<MovimentacaoCaixaEntity> findBySessaoIdOrderByDataMovimentacaoDesc(String sessaoId);

    /**
     * Calcula o saldo total de uma sessão (soma de todas as movimentações -
     * sangrias e suprimentos).
     */
    @Query("SELECT COALESCE(SUM(m.valor), 0) FROM MovimentacaoCaixaEntity m WHERE m.sessaoId = :sessaoId")
    BigDecimal calcularSaldoSessao(@Param("sessaoId") String sessaoId);

    /**
     * Verifica se já existe movimentação de determinado tipo para a sessão.
     */
    boolean existsBySessaoIdAndTipo(String sessaoId, com.sonecadelivery.pedidos.domain.entities.TipoMovimentacaoCaixa tipo);

    /**
     * Busca todas as descrições distintas de movimentações com contagem de uso.
     * Ordenado pela mais usada (maior contagem primeiro).
     */
    @Query("SELECT m.descricao, COUNT(m) as quantidade FROM MovimentacaoCaixaEntity m " +
            "WHERE m.descricao IS NOT NULL AND m.descricao <> '' " +
            "GROUP BY m.descricao " +
            "ORDER BY quantidade DESC, m.descricao ASC")
    List<Object[]> findDescricoesComContagem();

    /**
     * Busca estatísticas de sangrias agrupadas por descrição.
     * Retorna descrição, quantidade e valor total.
     * Limitado às 20 mais usadas.
     */
    @Query("SELECT m.descricao, COUNT(m) as quantidade, COALESCE(SUM(ABS(m.valor)), 0) as valorTotal " +
            "FROM MovimentacaoCaixaEntity m " +
            "WHERE m.tipo = :tipo " +
            "AND m.descricao IS NOT NULL AND m.descricao <> '' " +
            "GROUP BY m.descricao " +
            "ORDER BY quantidade DESC, m.descricao ASC")
    List<Object[]> findEstatisticasPorTipo(
            @Param("tipo") com.sonecadelivery.pedidos.domain.entities.TipoMovimentacaoCaixa tipo);
}
