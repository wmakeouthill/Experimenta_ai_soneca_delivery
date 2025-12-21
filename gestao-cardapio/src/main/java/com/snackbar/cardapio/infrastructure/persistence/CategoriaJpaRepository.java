package com.snackbar.cardapio.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CategoriaJpaRepository extends JpaRepository<CategoriaEntity, String> {
    List<CategoriaEntity> findByAtivaTrue();
}

