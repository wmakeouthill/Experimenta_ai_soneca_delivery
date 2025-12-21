package com.sonecadelivery.pedidos.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

/**
 * Repositório JPA para Motoboy.
 */
@Repository
public interface MotoboyJpaRepository extends JpaRepository<MotoboyEntity, String> {

    /**
     * Busca motoboys ativos.
     */
    List<MotoboyEntity> findByAtivoTrue();

    /**
     * Busca motoboys ativos ordenados por nome.
     */
    List<MotoboyEntity> findByAtivoTrueOrderByNomeAsc();

    /**
     * Busca todos os motoboys ordenados por nome.
     */
    List<MotoboyEntity> findAllByOrderByNomeAsc();

    /**
     * Busca motoboy por telefone.
     */
    Optional<MotoboyEntity> findByTelefone(String telefone);

    /**
     * Busca motoboys por IDs.
     */
    List<MotoboyEntity> findByIdIn(Collection<String> ids);

    /**
     * Verifica se existe motoboy com o telefone informado.
     */
    boolean existsByTelefone(String telefone);

    /**
     * Verifica se existe outro motoboy com o telefone informado (para atualização).
     */
    boolean existsByTelefoneAndIdNot(String telefone, String id);
}
