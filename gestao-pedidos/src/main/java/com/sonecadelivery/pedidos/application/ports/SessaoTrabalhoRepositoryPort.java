package com.sonecadelivery.pedidos.application.ports;

import com.sonecadelivery.pedidos.domain.entities.SessaoTrabalho;
import com.sonecadelivery.pedidos.domain.entities.StatusSessao;
import org.springframework.lang.NonNull;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface SessaoTrabalhoRepositoryPort {
    SessaoTrabalho salvar(@NonNull SessaoTrabalho sessao);
    
    Optional<SessaoTrabalho> buscarPorId(@NonNull String id);
    
    Optional<SessaoTrabalho> buscarSessaoAtiva();
    
    List<SessaoTrabalho> buscarPorDataInicio(LocalDate dataInicio);
    
    Optional<SessaoTrabalho> buscarUltimaSessaoPorData(LocalDate dataInicio);
    
    List<SessaoTrabalho> buscarTodas();
    
    List<SessaoTrabalho> buscarPorStatus(StatusSessao status);
    
    Optional<SessaoTrabalho> buscarSessaoAnterior(LocalDateTime dataInicioCompleta);
}

