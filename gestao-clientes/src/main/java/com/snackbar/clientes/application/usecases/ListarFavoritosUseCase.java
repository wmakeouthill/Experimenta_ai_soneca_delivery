package com.snackbar.clientes.application.usecases;

import com.snackbar.clientes.application.dto.ClienteFavoritoDTO;
import com.snackbar.clientes.application.ports.ClienteFavoritoRepositoryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ListarFavoritosUseCase {

    private final ClienteFavoritoRepositoryPort favoritoRepository;

    public List<ClienteFavoritoDTO> executar(String clienteId) {
        return favoritoRepository.buscarPorCliente(clienteId)
                .stream()
                .map(ClienteFavoritoDTO::de)
                .collect(Collectors.toList());
    }

    public List<String> listarIdsProdutos(String clienteId) {
        return favoritoRepository.buscarPorCliente(clienteId)
                .stream()
                .map(f -> f.getProdutoId())
                .collect(Collectors.toList());
    }

    public boolean isFavorito(String clienteId, String produtoId) {
        return favoritoRepository.existe(clienteId, produtoId);
    }
}
