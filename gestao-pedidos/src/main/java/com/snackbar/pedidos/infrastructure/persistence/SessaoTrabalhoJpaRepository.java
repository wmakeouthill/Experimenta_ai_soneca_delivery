package com.snackbar.pedidos.infrastructure.persistence;

import com.snackbar.pedidos.domain.entities.StatusSessao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface SessaoTrabalhoJpaRepository extends JpaRepository<SessaoTrabalhoEntity, String> {
    Optional<SessaoTrabalhoEntity> findFirstByStatusInOrderByDataInicioCompletaDesc(List<StatusSessao> statuses);
    
    Optional<SessaoTrabalhoEntity> findFirstByStatusOrderByDataInicioCompletaDesc(StatusSessao status);
    
    List<SessaoTrabalhoEntity> findByDataInicioOrderByNumeroSessaoDesc(LocalDate dataInicio);
    
    Optional<SessaoTrabalhoEntity> findFirstByDataInicioOrderByNumeroSessaoDesc(LocalDate dataInicio);
    
    List<SessaoTrabalhoEntity> findAllByOrderByDataInicioCompletaDesc();
    
    List<SessaoTrabalhoEntity> findByStatusOrderByDataInicioCompletaDesc(StatusSessao status);
    
    Optional<SessaoTrabalhoEntity> findFirstByDataInicioCompletaBeforeAndStatusOrderByDataInicioCompletaDesc(
            LocalDateTime dataInicioCompleta, StatusSessao status);
}

