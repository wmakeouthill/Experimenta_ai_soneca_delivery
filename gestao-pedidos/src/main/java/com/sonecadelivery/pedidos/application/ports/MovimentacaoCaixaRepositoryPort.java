package com.sonecadelivery.pedidos.application.ports;

import com.sonecadelivery.pedidos.application.dto.DescricaoMovimentacaoDTO;
import com.sonecadelivery.pedidos.application.dto.EstatisticaMovimentacaoDTO;
import com.sonecadelivery.pedidos.domain.entities.MovimentacaoCaixa;
import com.sonecadelivery.pedidos.domain.entities.TipoMovimentacaoCaixa;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

/**
 * Port para o repositório de movimentações de caixa.
 * Registra apenas sangrias e suprimentos.
 * Vendas em dinheiro são buscadas da tabela de pedidos.
 */
public interface MovimentacaoCaixaRepositoryPort {

    MovimentacaoCaixa salvar(MovimentacaoCaixa movimentacao);

    Optional<MovimentacaoCaixa> buscarPorId(String id);

    List<MovimentacaoCaixa> buscarPorSessaoId(String sessaoId);

    BigDecimal calcularSaldoSessao(String sessaoId);

    boolean existeMovimentacaoTipo(String sessaoId, TipoMovimentacaoCaixa tipo);

    /**
     * Busca todas as descrições de movimentações com contagem de uso.
     * Ordenado pela mais usada primeiro.
     */
    List<DescricaoMovimentacaoDTO> buscarDescricoesComContagem();

    /**
     * Busca estatísticas de sangrias agrupadas por descrição.
     * 
     * @param limite número máximo de resultados
     */
    List<EstatisticaMovimentacaoDTO> buscarEstatisticasSangrias(int limite);

    /**
     * Busca estatísticas de suprimentos agrupadas por descrição.
     * 
     * @param limite número máximo de resultados
     */
    List<EstatisticaMovimentacaoDTO> buscarEstatisticasSuprimentos(int limite);
}
