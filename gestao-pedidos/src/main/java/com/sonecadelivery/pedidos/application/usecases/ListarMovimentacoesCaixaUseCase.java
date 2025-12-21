package com.sonecadelivery.pedidos.application.usecases;

import com.sonecadelivery.pedidos.application.dto.MovimentacaoCaixaDTO;
import com.sonecadelivery.pedidos.application.ports.MovimentacaoCaixaRepositoryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Use case para listar movimentações de caixa de uma sessão.
 */
@Service
@RequiredArgsConstructor
public class ListarMovimentacoesCaixaUseCase {
    
    private final MovimentacaoCaixaRepositoryPort repository;
    
    public List<MovimentacaoCaixaDTO> executar(@NonNull String sessaoId) {
        return repository.buscarPorSessaoId(sessaoId)
                .stream()
                .map(MovimentacaoCaixaDTO::de)
                .toList();
    }
}

