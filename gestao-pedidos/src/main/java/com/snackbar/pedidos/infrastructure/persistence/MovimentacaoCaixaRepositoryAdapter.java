package com.snackbar.pedidos.infrastructure.persistence;

import com.snackbar.pedidos.application.dto.DescricaoMovimentacaoDTO;
import com.snackbar.pedidos.application.dto.EstatisticaMovimentacaoDTO;
import com.snackbar.pedidos.application.ports.MovimentacaoCaixaRepositoryPort;
import com.snackbar.pedidos.domain.entities.MovimentacaoCaixa;
import com.snackbar.pedidos.domain.entities.TipoMovimentacaoCaixa;
import com.snackbar.pedidos.infrastructure.mappers.MovimentacaoCaixaMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

/**
 * Adapter para o repositório de movimentações de caixa.
 * Registra apenas sangrias e suprimentos.
 */
@Component
@RequiredArgsConstructor
@SuppressWarnings("null") // Warnings de null safety são falsos positivos - JPA garante não-nulidade
public class MovimentacaoCaixaRepositoryAdapter implements MovimentacaoCaixaRepositoryPort {

    private final MovimentacaoCaixaJpaRepository jpaRepository;
    private final MovimentacaoCaixaMapper mapper;

    @Override
    public MovimentacaoCaixa salvar(MovimentacaoCaixa movimentacao) {
        MovimentacaoCaixaEntity entity = mapper.paraEntity(movimentacao);
        MovimentacaoCaixaEntity savedEntity = jpaRepository.save(entity);
        return mapper.paraDomain(savedEntity);
    }

    @Override
    public Optional<MovimentacaoCaixa> buscarPorId(String id) {
        return jpaRepository.findById(id).map(mapper::paraDomain);
    }

    @Override
    public List<MovimentacaoCaixa> buscarPorSessaoId(String sessaoId) {
        return jpaRepository.findBySessaoIdOrderByDataMovimentacaoDesc(sessaoId)
                .stream()
                .map(mapper::paraDomain)
                .toList();
    }

    @Override
    public BigDecimal calcularSaldoSessao(String sessaoId) {
        return jpaRepository.calcularSaldoSessao(sessaoId);
    }

    @Override
    public boolean existeMovimentacaoTipo(String sessaoId, TipoMovimentacaoCaixa tipo) {
        return jpaRepository.existsBySessaoIdAndTipo(sessaoId, tipo);
    }

    @Override
    public List<DescricaoMovimentacaoDTO> buscarDescricoesComContagem() {
        return jpaRepository.findDescricoesComContagem()
                .stream()
                .map(row -> new DescricaoMovimentacaoDTO(
                        (String) row[0],
                        (Long) row[1]))
                .toList();
    }

    @Override
    public List<EstatisticaMovimentacaoDTO> buscarEstatisticasSangrias(int limite) {
        return jpaRepository.findEstatisticasPorTipo(TipoMovimentacaoCaixa.SANGRIA)
                .stream()
                .limit(limite)
                .map(this::mapToEstatistica)
                .toList();
    }

    @Override
    public List<EstatisticaMovimentacaoDTO> buscarEstatisticasSuprimentos(int limite) {
        return jpaRepository.findEstatisticasPorTipo(TipoMovimentacaoCaixa.SUPRIMENTO)
                .stream()
                .limit(limite)
                .map(this::mapToEstatistica)
                .toList();
    }

    private EstatisticaMovimentacaoDTO mapToEstatistica(Object[] row) {
        return new EstatisticaMovimentacaoDTO(
                (String) row[0],
                (Long) row[1],
                (BigDecimal) row[2]);
    }
}
