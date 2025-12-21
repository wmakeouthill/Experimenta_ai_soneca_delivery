package com.sonecadelivery.cardapio.application.ports;

import com.sonecadelivery.cardapio.domain.entities.Produto;
import org.springframework.lang.NonNull;

import java.util.List;
import java.util.Optional;

public interface ProdutoRepositoryPort {
    Produto salvar(@NonNull Produto produto);
    Optional<Produto> buscarPorId(@NonNull String id);
    List<Produto> buscarTodos();
    List<Produto> buscarPorCategoria(String categoria);
    List<Produto> buscarDisponiveis();
    void excluir(@NonNull String id);
    boolean existePorId(@NonNull String id);
}

