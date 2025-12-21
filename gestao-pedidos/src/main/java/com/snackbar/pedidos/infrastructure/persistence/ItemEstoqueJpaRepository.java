package com.snackbar.pedidos.infrastructure.persistence;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repositório JPA para ItemEstoqueEntity.
 */
@Repository
public interface ItemEstoqueJpaRepository extends JpaRepository<ItemEstoqueEntity, String> {
    
    Optional<ItemEstoqueEntity> findByNomeIgnoreCase(String nome);
    
    Page<ItemEstoqueEntity> findByAtivoTrue(Pageable pageable);
    
    Page<ItemEstoqueEntity> findByNomeContainingIgnoreCase(String nome, Pageable pageable);
    
    boolean existsByNomeIgnoreCase(String nome);
    
    boolean existsByNomeIgnoreCaseAndIdNot(String nome, String id);
}

