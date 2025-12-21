package com.sonecadelivery.pedidos.application.usecases;

import com.sonecadelivery.pedidos.application.dto.EstatisticaMovimentacaoDTO;
import com.sonecadelivery.pedidos.application.dto.EstatisticasCaixaDTO;
import com.sonecadelivery.pedidos.application.ports.MovimentacaoCaixaRepositoryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Use case para buscar estatísticas de movimentações de caixa.
 * Retorna estatísticas separadas para sangrias e suprimentos.
 */
@Service
@RequiredArgsConstructor
public class BuscarEstatisticasCaixaUseCase {

    private static final int LIMITE_DESCRICOES = 20;

    private final MovimentacaoCaixaRepositoryPort repository;

    /**
     * Executa a busca de estatísticas de movimentações.
     * 
     * @return estatísticas com as 20 descrições mais usadas para cada tipo
     */
    public EstatisticasCaixaDTO executar() {
        List<EstatisticaMovimentacaoDTO> sangrias = repository.buscarEstatisticasSangrias(LIMITE_DESCRICOES);
        List<EstatisticaMovimentacaoDTO> suprimentos = repository.buscarEstatisticasSuprimentos(LIMITE_DESCRICOES);

        return new EstatisticasCaixaDTO(sangrias, suprimentos);
    }
}
