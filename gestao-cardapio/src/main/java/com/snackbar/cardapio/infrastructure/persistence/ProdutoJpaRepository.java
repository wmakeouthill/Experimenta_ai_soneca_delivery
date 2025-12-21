package com.snackbar.cardapio.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProdutoJpaRepository extends JpaRepository<ProdutoEntity, String> {
    List<ProdutoEntity> findByCategoria(String categoria);
    List<ProdutoEntity> findByDisponivelTrue();
    List<ProdutoEntity> findByCategoriaAndDisponivelTrue(String categoria);
}

