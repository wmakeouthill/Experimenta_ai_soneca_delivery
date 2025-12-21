package com.snackbar.pedidos.infrastructure.persistence.repositories;

import com.snackbar.pedidos.infrastructure.persistence.entities.MesaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repositório JPA para Mesa.
 */
@Repository
public interface MesaJpaRepository extends JpaRepository<MesaEntity, String> {

    Optional<MesaEntity> findByNumero(Integer numero);

    Optional<MesaEntity> findByQrCodeToken(String qrCodeToken);

    List<MesaEntity> findByAtivaTrue();

    List<MesaEntity> findAllByOrderByNumeroAsc();

    boolean existsByNumero(Integer numero);

    @Query("SELECT CASE WHEN COUNT(m) > 0 THEN true ELSE false END FROM MesaEntity m WHERE m.numero = :numero AND m.id != :id")
    boolean existsByNumeroAndIdNot(Integer numero, String id);
}
