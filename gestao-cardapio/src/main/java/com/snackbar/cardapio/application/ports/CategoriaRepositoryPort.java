package com.snackbar.cardapio.application.ports;

import com.snackbar.cardapio.domain.entities.Categoria;
import org.springframework.lang.NonNull;

import java.util.List;
import java.util.Optional;

public interface CategoriaRepositoryPort {
    Categoria salvar(@NonNull Categoria categoria);
    Optional<Categoria> buscarPorId(@NonNull String id);
    List<Categoria> buscarTodas();
    List<Categoria> buscarAtivas();
    void excluir(@NonNull String id);
    boolean existePorId(@NonNull String id);
}

