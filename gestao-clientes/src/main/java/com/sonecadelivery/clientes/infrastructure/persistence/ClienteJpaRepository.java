package com.sonecadelivery.clientes.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClienteJpaRepository extends JpaRepository<ClienteEntity, String> {

    List<ClienteEntity> findByTelefone(String telefone);

    List<ClienteEntity> findByNomeContainingIgnoreCase(String nome);

    Optional<ClienteEntity> findByGoogleId(String googleId);

    Optional<ClienteEntity> findByEmail(String email);

    boolean existsByGoogleId(String googleId);

    boolean existsByTelefone(String telefone);

    boolean existsByEmail(String email);
}
