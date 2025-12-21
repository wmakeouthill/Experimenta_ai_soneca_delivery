package com.sonecadelivery.pedidos.application.usecases;

import com.sonecadelivery.pedidos.application.dto.DescricaoMovimentacaoDTO;
import com.sonecadelivery.pedidos.application.ports.MovimentacaoCaixaRepositoryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Use case para buscar descrições de movimentações de caixa com contagem.
 * Utilizado para autocomplete no frontend, ordenado por frequência de uso.
 */
@Service
@RequiredArgsConstructor
public class BuscarDescricoesMovimentacaoUseCase {

    private final MovimentacaoCaixaRepositoryPort repository;

    /**
     * Executa a busca de descrições com contagem de uso.
     * 
     * @return lista de descrições com quantidade de uso, ordenadas por frequência
     */
    public List<DescricaoMovimentacaoDTO> executar() {
        return repository.buscarDescricoesComContagem();
    }
}
