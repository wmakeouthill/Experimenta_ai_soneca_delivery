package com.sonecadelivery.clientes.application.usecases;

import com.sonecadelivery.clientes.application.ports.ClienteAvaliacaoRepositoryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RemoverAvaliacaoUseCase {

    private final ClienteAvaliacaoRepositoryPort avaliacaoRepository;

    public void executar(String clienteId, String produtoId) {
        var avaliacao = avaliacaoRepository.buscarPorClienteProduto(clienteId, produtoId)
                .orElseThrow(() -> new IllegalArgumentException("Avaliação não encontrada"));

        avaliacaoRepository.remover(avaliacao.getId());
    }
}
