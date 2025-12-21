package com.snackbar.impressao.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ConfiguracaoImpressoraJpaRepository extends JpaRepository<ConfiguracaoImpressoraJpaEntity, String> {
    Optional<ConfiguracaoImpressoraJpaEntity> findByAtivaTrue();
}

