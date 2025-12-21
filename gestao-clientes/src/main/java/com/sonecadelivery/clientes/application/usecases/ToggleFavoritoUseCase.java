package com.sonecadelivery.clientes.application.usecases;

import com.sonecadelivery.clientes.application.ports.ClienteFavoritoRepositoryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ToggleFavoritoUseCase {

    private final ClienteFavoritoRepositoryPort favoritoRepository;
    private final AdicionarFavoritoUseCase adicionarFavoritoUseCase;
    private final RemoverFavoritoUseCase removerFavoritoUseCase;

    /**
     * Alterna o estado de favorito de um produto para um cliente.
     * Se já é favorito, remove. Se não é, adiciona.
     * 
     * @param clienteId ID do cliente
     * @param produtoId ID do produto
     * @return true se adicionou aos favoritos, false se removeu
     */
    public boolean executar(String clienteId, String produtoId) {
        if (favoritoRepository.existe(clienteId, produtoId)) {
            removerFavoritoUseCase.executar(clienteId, produtoId);
            return false;
        } else {
            com.sonecadelivery.clientes.application.dto.AdicionarFavoritoRequest request = com.sonecadelivery.clientes.application.dto.AdicionarFavoritoRequest
                    .builder()
                    .produtoId(produtoId)
                    .build();
            adicionarFavoritoUseCase.executar(clienteId, request);
            return true;
        }
    }
}
