package com.snackbar.cardapio.application.ports;

import com.snackbar.cardapio.domain.entities.Adicional;
import org.springframework.lang.NonNull;

import java.util.List;
import java.util.Optional;

public interface AdicionalRepositoryPort {
    Adicional salvar(@NonNull Adicional adicional);

    Optional<Adicional> buscarPorId(@NonNull String id);

    List<Adicional> buscarTodos();

    List<Adicional> buscarDisponiveis();

    List<Adicional> buscarPorCategoria(String categoria);

    List<Adicional> buscarPorIds(List<String> ids);

    void excluir(@NonNull String id);

    boolean existePorId(@NonNull String id);
}
