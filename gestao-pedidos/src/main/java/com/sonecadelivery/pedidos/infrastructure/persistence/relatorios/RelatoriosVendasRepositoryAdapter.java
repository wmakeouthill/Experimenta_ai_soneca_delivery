package com.sonecadelivery.pedidos.infrastructure.persistence.relatorios;

import com.sonecadelivery.pedidos.application.dtos.relatorios.CategoriaVendasResumoDTO;
import com.sonecadelivery.pedidos.application.dtos.relatorios.DistribuicaoClientesDTO;
import com.sonecadelivery.pedidos.application.dtos.relatorios.DistribuicaoHorariaDTO;
import com.sonecadelivery.pedidos.application.dtos.relatorios.DistribuicaoMeioPagamentoDTO;
import com.sonecadelivery.pedidos.application.dtos.relatorios.EvolucaoVendasPontoDTO;
import com.sonecadelivery.pedidos.application.dtos.relatorios.FiltroRelatorioTemporalDTO;
import com.sonecadelivery.pedidos.application.dtos.relatorios.IndicadoresResumoDTO;
import com.sonecadelivery.pedidos.application.dtos.relatorios.PedidosPorHorarioDTO;
import com.sonecadelivery.pedidos.application.dtos.relatorios.ProdutoMaisVendidoDTO;
import com.sonecadelivery.pedidos.application.dtos.relatorios.QuantidadePorCategoriaDTO;
import com.sonecadelivery.pedidos.application.ports.RelatoriosVendasPort;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Date;
import java.time.LocalDate;
import java.util.List;

@Component
@RequiredArgsConstructor
public class RelatoriosVendasRepositoryAdapter implements RelatoriosVendasPort {

    /**
     * Expressão SQL que define a data base para agrupamento de relatórios.
     * 
     * REGRA IMPORTANTE: Quando um pedido está associado a uma sessão, usa-se a data
     * de INÍCIO da sessão
     * (st.data_inicio), não a data do pedido. Isso garante que:
     * - Se uma sessão iniciou no dia 23 e fechou no dia 24, TODOS os pedidos dessa
     * sessão
     * aparecerão apenas no dia 23 (data de início), mesmo que alguns pedidos tenham
     * sido
     * criados após a meia-noite do dia 24.
     * - Apenas pedidos sem sessão associada usam a data do próprio pedido como
     * fallback.
     */
    private static final String DATA_BASE_EXPR = "COALESCE(st.data_inicio, DATE(p.data_pedido))";
    private static final String PARAMETRO_INICIO = "inicio";
    private static final String PARAMETRO_FIM = "fim";
    private static final String SELECT_DATE_CONCAT_YEAR = "SELECT DATE(CONCAT(YEAR(";

    @PersistenceContext
    private final EntityManager entityManager;
    private final RelatorioBucketFactory bucketFactory = new RelatorioBucketFactory();

    @Override
    @Transactional(readOnly = true)
    public List<EvolucaoVendasPontoDTO> obterEvolucao(FiltroRelatorioTemporalDTO filtro) {
        List<RelatorioBucketFactory.RelatorioBucket> buckets;

        if (filtro.granularidade() == com.sonecadelivery.pedidos.application.dtos.relatorios.GranularidadeTempo.ANO) {
            buckets = criarBucketsAno(filtro);
        } else {
            buckets = bucketFactory.criarBuckets(filtro);
        }

        if (buckets.isEmpty()) {
            return List.of();
        }

        String sql = construirSqlEvolucao(filtro);
        Query query = entityManager.createNativeQuery(sql);
        configurarIntervalo(query, filtro);

        @SuppressWarnings("unchecked")
        List<Object[]> resultados = query.getResultList();
        for (Object[] registro : resultados) {
            bucketFactory.acumular(
                    buckets,
                    converterData(registro[0]),
                    converterDecimal(registro[1]),
                    converterLong(registro[2]));
        }

        return buckets.stream()
                .map(RelatorioBucketFactory.RelatorioBucket::toDto)
                .toList();
    }

    private String construirSqlEvolucao(FiltroRelatorioTemporalDTO filtro) {
        return switch (filtro.granularidade()) {
            case DIA -> "SELECT " + DATA_BASE_EXPR + " AS data_base, " +
                    "SUM(p.valor_total) AS total_vendas, " +
                    "COUNT(*) AS total_pedidos " +
                    "FROM pedidos p " +
                    "LEFT JOIN sessoes_trabalho st ON st.id = p.sessao_id " +
                    "WHERE " + DATA_BASE_EXPR + " >= :inicio " +
                    "AND " + DATA_BASE_EXPR + " < :fim " +
                    "AND p.status <> 'CANCELADO' " +
                    "GROUP BY data_base " +
                    "ORDER BY data_base";
            case SEMANA -> "SELECT DATE(" + DATA_BASE_EXPR + ") AS data_base, " +
                    "SUM(p.valor_total) AS total_vendas, " +
                    "COUNT(*) AS total_pedidos " +
                    "FROM pedidos p " +
                    "LEFT JOIN sessoes_trabalho st ON st.id = p.sessao_id " +
                    "WHERE " + DATA_BASE_EXPR + " >= :inicio " +
                    "AND " + DATA_BASE_EXPR + " < :fim " +
                    "AND p.status <> 'CANCELADO' " +
                    "GROUP BY DATE(" + DATA_BASE_EXPR + ") " +
                    "ORDER BY data_base";
            case MES -> SELECT_DATE_CONCAT_YEAR + DATA_BASE_EXPR + "), '-', MONTH(" + DATA_BASE_EXPR
                    + "), '-01')) AS data_base, " +
                    "SUM(p.valor_total) AS total_vendas, " +
                    "COUNT(*) AS total_pedidos " +
                    "FROM pedidos p " +
                    "LEFT JOIN sessoes_trabalho st ON st.id = p.sessao_id " +
                    "WHERE " + DATA_BASE_EXPR + " >= :inicio " +
                    "AND " + DATA_BASE_EXPR + " < :fim " +
                    "AND p.status <> 'CANCELADO' " +
                    "GROUP BY DATE(CONCAT(YEAR(" + DATA_BASE_EXPR + "), '-', MONTH(" + DATA_BASE_EXPR + "), '-01')) " +
                    "ORDER BY data_base";
            case TRIMESTRE -> SELECT_DATE_CONCAT_YEAR + DATA_BASE_EXPR + "), '-', ((QUARTER(" + DATA_BASE_EXPR
                    + ") - 1) * 3 + 1), '-01')) AS data_base, " +
                    "SUM(p.valor_total) AS total_vendas, " +
                    "COUNT(*) AS total_pedidos " +
                    "FROM pedidos p " +
                    "LEFT JOIN sessoes_trabalho st ON st.id = p.sessao_id " +
                    "WHERE " + DATA_BASE_EXPR + " >= :inicio " +
                    "AND " + DATA_BASE_EXPR + " < :fim " +
                    "AND p.status <> 'CANCELADO' " +
                    "GROUP BY DATE(CONCAT(YEAR(" + DATA_BASE_EXPR + "), '-', ((QUARTER(" + DATA_BASE_EXPR
                    + ") - 1) * 3 + 1), '-01')) " +
                    "ORDER BY data_base";
            case SEMESTRE -> SELECT_DATE_CONCAT_YEAR + DATA_BASE_EXPR + "), '-', IF(MONTH(" + DATA_BASE_EXPR
                    + ") <= 6, 1, 7), '-01')) AS data_base, " +
                    "SUM(p.valor_total) AS total_vendas, " +
                    "COUNT(*) AS total_pedidos " +
                    "FROM pedidos p " +
                    "LEFT JOIN sessoes_trabalho st ON st.id = p.sessao_id " +
                    "WHERE " + DATA_BASE_EXPR + " >= :inicio " +
                    "AND " + DATA_BASE_EXPR + " < :fim " +
                    "AND p.status <> 'CANCELADO' " +
                    "GROUP BY DATE(CONCAT(YEAR(" + DATA_BASE_EXPR + "), '-', IF(MONTH(" + DATA_BASE_EXPR
                    + ") <= 6, 1, 7), '-01')) " +
                    "ORDER BY data_base";
            case ANO -> SELECT_DATE_CONCAT_YEAR + DATA_BASE_EXPR + "), '-01-01')) AS data_base, " +
                    "SUM(p.valor_total) AS total_vendas, " +
                    "COUNT(*) AS total_pedidos " +
                    "FROM pedidos p " +
                    "LEFT JOIN sessoes_trabalho st ON st.id = p.sessao_id " +
                    "WHERE " + DATA_BASE_EXPR + " >= :inicio " +
                    "AND " + DATA_BASE_EXPR + " < :fim " +
                    "AND p.status <> 'CANCELADO' " +
                    "GROUP BY DATE(CONCAT(YEAR(" + DATA_BASE_EXPR + "), '-01-01')) " +
                    "ORDER BY data_base";
        };
    }

    private List<RelatorioBucketFactory.RelatorioBucket> criarBucketsAno(FiltroRelatorioTemporalDTO filtro) {
        // Cria buckets para cada ano no intervalo definido pelo filtro
        List<RelatorioBucketFactory.RelatorioBucket> buckets = new java.util.ArrayList<>();
        int anoInicio = filtro.inicio().getYear();
        int anoFim = filtro.fim().getYear();
        for (int ano = anoInicio; ano <= anoFim; ano++) {
            buckets.add(bucketFactory.criarBucketAno(ano));
        }
        return buckets;
    }

    @Override
    @Transactional(readOnly = true)
    public List<CategoriaVendasResumoDTO> obterCategorias(FiltroRelatorioTemporalDTO filtro) {
        // Calcula o valor total do item incluindo adicionais:
        // (preco_unitario + soma_adicionais_por_unidade) * quantidade
        String sql = "SELECT COALESCE(prod.categoria, 'Sem categoria') AS categoria_nome, " +
                "SUM((item.preco_unitario + COALESCE(ad_sum.total_adicionais, 0)) * item.quantidade) AS valor_total, " +
                "COUNT(DISTINCT p.id) AS total_pedidos " +
                "FROM pedidos p " +
                "JOIN itens_pedido item ON item.pedido_id = p.id " +
                "LEFT JOIN produtos prod ON prod.id = item.produto_id " +
                "LEFT JOIN sessoes_trabalho st ON st.id = p.sessao_id " +
                "LEFT JOIN (SELECT ad.item_pedido_id, SUM(ad.preco_unitario * ad.quantidade) AS total_adicionais " +
                "           FROM itens_pedido_adicionais ad GROUP BY ad.item_pedido_id) ad_sum ON ad_sum.item_pedido_id = item.id "
                +
                "WHERE " + DATA_BASE_EXPR + " >= :inicio " +
                "AND " + DATA_BASE_EXPR + " < :fim " +
                "AND p.status <> 'CANCELADO' " +
                "GROUP BY categoria_nome " +
                "ORDER BY valor_total DESC";
        Query query = entityManager.createNativeQuery(sql);
        configurarIntervalo(query, filtro);
        return RelatorioResultMapper.categorias(query.getResultList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<QuantidadePorCategoriaDTO> obterQuantidadePorCategoria(FiltroRelatorioTemporalDTO filtro) {
        String sql = "SELECT COALESCE(prod.categoria, 'Sem categoria') AS categoria_id, " +
                "COALESCE(prod.categoria, 'Sem categoria') AS categoria_nome, " +
                "SUM(item.quantidade) AS quantidade_vendida " +
                "FROM pedidos p " +
                "JOIN itens_pedido item ON item.pedido_id = p.id " +
                "LEFT JOIN produtos prod ON prod.id = item.produto_id " +
                "LEFT JOIN sessoes_trabalho st ON st.id = p.sessao_id " +
                "WHERE " + DATA_BASE_EXPR + " >= :inicio " +
                "AND " + DATA_BASE_EXPR + " < :fim " +
                "AND p.status <> 'CANCELADO' " +
                "GROUP BY categoria_id, categoria_nome " +
                "ORDER BY quantidade_vendida DESC";
        Query query = entityManager.createNativeQuery(sql);
        configurarIntervalo(query, filtro);
        return RelatorioResultMapper.quantidadePorCategoria(query.getResultList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProdutoMaisVendidoDTO> obterTopProdutos(FiltroRelatorioTemporalDTO filtro, int limite) {
        // Calcula o valor total do item incluindo adicionais:
        // (preco_unitario + soma_adicionais_por_unidade) * quantidade
        String sql = "SELECT item.produto_id, " +
                "item.produto_nome, " +
                "SUM(item.quantidade) AS quantidade, " +
                "SUM((item.preco_unitario + COALESCE(ad_sum.total_adicionais, 0)) * item.quantidade) AS valor_total " +
                "FROM pedidos p " +
                "JOIN itens_pedido item ON item.pedido_id = p.id " +
                "LEFT JOIN sessoes_trabalho st ON st.id = p.sessao_id " +
                "LEFT JOIN (SELECT ad.item_pedido_id, SUM(ad.preco_unitario * ad.quantidade) AS total_adicionais " +
                "           FROM itens_pedido_adicionais ad GROUP BY ad.item_pedido_id) ad_sum ON ad_sum.item_pedido_id = item.id "
                +
                "WHERE " + DATA_BASE_EXPR + " >= :inicio " +
                "AND " + DATA_BASE_EXPR + " < :fim " +
                "AND p.status <> 'CANCELADO' " +
                "GROUP BY item.produto_id, item.produto_nome " +
                "ORDER BY quantidade DESC, valor_total DESC";
        Query query = entityManager.createNativeQuery(sql);
        configurarIntervalo(query, filtro);
        query.setMaxResults(Math.max(limite, 1));
        return RelatorioResultMapper.produtos(query.getResultList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<DistribuicaoHorariaDTO> obterDistribuicaoHoraria(FiltroRelatorioTemporalDTO filtro) {
        String sql = "SELECT LPAD(HOUR(p.data_pedido), 2, '0') AS hora, " +
                "SUM(p.valor_total) AS valor_total, " +
                "COUNT(*) AS total_pedidos " +
                "FROM pedidos p " +
                "LEFT JOIN sessoes_trabalho st ON st.id = p.sessao_id " +
                "WHERE " + DATA_BASE_EXPR + " >= :inicio " +
                "AND " + DATA_BASE_EXPR + " < :fim " +
                "AND p.status <> 'CANCELADO' " +
                "GROUP BY hora " +
                "ORDER BY MIN(p.data_pedido)";
        Query query = entityManager.createNativeQuery(sql);
        configurarIntervalo(query, filtro);
        return RelatorioResultMapper.horarios(query.getResultList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<PedidosPorHorarioDTO> obterPedidosPorHorario(FiltroRelatorioTemporalDTO filtro) {
        String sql = "SELECT LPAD(HOUR(p.data_pedido), 2, '0') AS hora, " +
                "COUNT(*) AS quantidade_pedidos, " +
                "SUM(p.valor_total) AS valor_total " +
                "FROM pedidos p " +
                "LEFT JOIN sessoes_trabalho st ON st.id = p.sessao_id " +
                "WHERE " + DATA_BASE_EXPR + " >= :inicio " +
                "AND " + DATA_BASE_EXPR + " < :fim " +
                "AND p.status <> 'CANCELADO' " +
                "GROUP BY hora " +
                "ORDER BY MIN(p.data_pedido)";
        Query query = entityManager.createNativeQuery(sql);
        configurarIntervalo(query, filtro);
        return RelatorioResultMapper.pedidosPorHorario(query.getResultList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<DistribuicaoClientesDTO> obterClientes(FiltroRelatorioTemporalDTO filtro, int limite) {
        String sql = "SELECT p.cliente_id, " +
                "p.cliente_nome, " +
                "SUM(p.valor_total) AS valor_total, " +
                "COUNT(*) AS total_pedidos " +
                "FROM pedidos p " +
                "LEFT JOIN sessoes_trabalho st ON st.id = p.sessao_id " +
                "WHERE " + DATA_BASE_EXPR + " >= :inicio " +
                "AND " + DATA_BASE_EXPR + " < :fim " +
                "AND p.status <> 'CANCELADO' " +
                "GROUP BY p.cliente_id, p.cliente_nome " +
                "ORDER BY valor_total DESC";
        Query query = entityManager.createNativeQuery(sql);
        configurarIntervalo(query, filtro);
        query.setMaxResults(Math.max(limite, 1));
        return RelatorioResultMapper.clientes(query.getResultList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<DistribuicaoMeioPagamentoDTO> obterMeiosPagamento(FiltroRelatorioTemporalDTO filtro) {
        String sql = "SELECT pagamento.meio_pagamento, " +
                "SUM(pagamento.valor) AS valor_total, " +
                "COUNT(DISTINCT p.id) AS pedidos " +
                "FROM pedidos p " +
                "JOIN meios_pagamento_pedido pagamento ON pagamento.pedido_id = p.id " +
                "LEFT JOIN sessoes_trabalho st ON st.id = p.sessao_id " +
                "WHERE " + DATA_BASE_EXPR + " >= :inicio " +
                "AND " + DATA_BASE_EXPR + " < :fim " +
                "AND p.status <> 'CANCELADO' " +
                "GROUP BY pagamento.meio_pagamento " +
                "ORDER BY valor_total DESC";
        Query query = entityManager.createNativeQuery(sql);
        configurarIntervalo(query, filtro);
        return RelatorioResultMapper.meiosPagamento(query.getResultList());
    }

    @Override
    @Transactional(readOnly = true)
    public IndicadoresResumoDTO obterIndicadores(FiltroRelatorioTemporalDTO filtro) {
        TotaisPeriodo atual = buscarTotais(filtro.inicio(), filtro.fim());
        TotaisPeriodo anterior = buscarTotais(filtro.inicioPeriodoAnterior(), filtro.fimPeriodoAnterior());
        double ticket = atual.totalPedidos() == 0 ? 0 : atual.totalVendas().doubleValue() / atual.totalPedidos();
        double crescimento = calcularCrescimento(atual.totalVendas(), anterior.totalVendas());
        return new IndicadoresResumoDTO(
                atual.totalVendas().doubleValue(),
                atual.totalPedidos(),
                ticket,
                crescimento);
    }

    private TotaisPeriodo buscarTotais(LocalDate inicio, LocalDate fim) {
        String sql = "SELECT COALESCE(SUM(p.valor_total), 0) AS total_vendas, " +
                "COUNT(*) AS total_pedidos " +
                "FROM pedidos p " +
                "LEFT JOIN sessoes_trabalho st ON st.id = p.sessao_id " +
                "WHERE " + DATA_BASE_EXPR + " >= :inicio " +
                "AND " + DATA_BASE_EXPR + " < :fim " +
                "AND p.status <> 'CANCELADO'";
        Query query = entityManager.createNativeQuery(sql);
        // Converte LocalDate para java.sql.Date para compatibilidade com MySQL DATE
        query.setParameter(PARAMETRO_INICIO, java.sql.Date.valueOf(inicio));
        query.setParameter(PARAMETRO_FIM, java.sql.Date.valueOf(fim));
        Object[] resultado = (Object[]) query.getSingleResult();
        BigDecimal total = converterDecimal(resultado[0]);
        long pedidos = converterLong(resultado[1]);
        return new TotaisPeriodo(total, pedidos);
    }

    private double calcularCrescimento(BigDecimal atual, BigDecimal anterior) {
        if (anterior == null || anterior.compareTo(BigDecimal.ZERO) == 0) {
            return atual.compareTo(BigDecimal.ZERO) > 0 ? 100.0 : 0.0;
        }
        BigDecimal diferenca = atual.subtract(anterior);
        return diferenca.divide(anterior, 4, RoundingMode.HALF_UP).doubleValue() * 100;
    }

    private void configurarIntervalo(Query query, FiltroRelatorioTemporalDTO filtro) {
        // Converte LocalDate para java.sql.Date para compatibilidade com MySQL DATE
        query.setParameter(PARAMETRO_INICIO, java.sql.Date.valueOf(filtro.inicio()));
        query.setParameter(PARAMETRO_FIM, java.sql.Date.valueOf(filtro.fim()));
    }

    private LocalDate converterData(Object valor) {
        if (valor instanceof LocalDate localDate) {
            return localDate;
        }
        if (valor instanceof Date date) {
            return date.toLocalDate();
        }
        throw new IllegalArgumentException("Tipo de data não suportado: " + valor);
    }

    private BigDecimal converterDecimal(Object valor) {
        if (valor instanceof BigDecimal bigDecimal) {
            return bigDecimal;
        }
        if (valor == null) {
            return BigDecimal.ZERO;
        }
        return new BigDecimal(valor.toString());
    }

    private long converterLong(Object valor) {
        if (valor == null) {
            return 0L;
        }
        return ((Number) valor).longValue();
    }

    private record TotaisPeriodo(BigDecimal totalVendas, long totalPedidos) {
    }
}
