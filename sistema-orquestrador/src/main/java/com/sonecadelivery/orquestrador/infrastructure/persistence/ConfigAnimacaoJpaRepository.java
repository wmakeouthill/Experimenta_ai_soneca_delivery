package com.sonecadelivery.orquestrador.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ConfigAnimacaoJpaRepository extends JpaRepository<ConfigAnimacaoEntity, String> {
    Optional<ConfigAnimacaoEntity> findFirstByOrderByCreatedAtAsc();
}

