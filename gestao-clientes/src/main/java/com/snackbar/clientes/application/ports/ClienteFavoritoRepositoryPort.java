package com.snackbar.clientes.application.ports;

import com.snackbar.clientes.domain.entities.ClienteFavorito;
import org.springframework.lang.NonNull;

import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface ClienteFavoritoRepositoryPort {

    ClienteFavorito salvar(@NonNull ClienteFavorito favorito);

    void remover(@NonNull String clienteId, @NonNull String produtoId);

    Optional<ClienteFavorito> buscar(@NonNull String clienteId, @NonNull String produtoId);

    List<ClienteFavorito> buscarPorCliente(@NonNull String clienteId);

    boolean existe(@NonNull String clienteId, @NonNull String produtoId);

    int contarPorCliente(@NonNull String clienteId);

    /**
     * Retorna um mapa de produtoId -> quantidade de favoritos,
     * ordenado por quantidade (decrescente).
     */
    Map<String, Long> buscarMaisFavoritados();
}
