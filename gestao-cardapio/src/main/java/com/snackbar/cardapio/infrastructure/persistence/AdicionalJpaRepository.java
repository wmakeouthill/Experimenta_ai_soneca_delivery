package com.snackbar.cardapio.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AdicionalJpaRepository extends JpaRepository<AdicionalEntity, String> {
    List<AdicionalEntity> findByDisponivelTrue();

    List<AdicionalEntity> findByCategoria(String categoria);

    List<AdicionalEntity> findByIdIn(List<String> ids);
}
