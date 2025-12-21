package com.sonecadelivery.pedidos.application.usecases;

import com.sonecadelivery.pedidos.application.dto.SessaoTrabalhoDTO;
import com.sonecadelivery.pedidos.application.ports.SessaoTrabalhoRepositoryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class BuscarSessaoAtivaUseCase {
    
    private final SessaoTrabalhoRepositoryPort repository;
    
    public Optional<SessaoTrabalhoDTO> executar() {
        return repository.buscarSessaoAtiva()
            .map(SessaoTrabalhoDTO::de);
    }
}

