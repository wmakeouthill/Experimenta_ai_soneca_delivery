package com.sonecadelivery.clientes.application.usecases;

import com.sonecadelivery.clientes.application.ports.ClienteFavoritoRepositoryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RemoverFavoritoUseCase {

    private final ClienteFavoritoRepositoryPort favoritoRepository;

    @Transactional
    public void executar(String clienteId, String produtoId) {
        if (!favoritoRepository.existe(clienteId, produtoId)) {
            throw new IllegalArgumentException("Favorito não encontrado");
        }

        favoritoRepository.remover(clienteId, produtoId);
    }
}
