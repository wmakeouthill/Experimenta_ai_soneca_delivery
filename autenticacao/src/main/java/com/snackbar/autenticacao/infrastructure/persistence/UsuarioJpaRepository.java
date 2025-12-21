package com.snackbar.autenticacao.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UsuarioJpaRepository extends JpaRepository<UsuarioEntity, String> {
    Optional<UsuarioEntity> findByEmail(String email);
    Optional<UsuarioEntity> findByEmailOrNome(String email, String nome);
    boolean existsByEmail(String email);
}

