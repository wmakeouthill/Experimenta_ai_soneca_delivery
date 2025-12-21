package com.sonecadelivery.pedidos.application.usecases;

import com.sonecadelivery.pedidos.application.dto.SessaoTrabalhoDTO;
import com.sonecadelivery.pedidos.application.ports.SessaoTrabalhoRepositoryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ListarSessoesTrabalhoUseCase {
    
    private final SessaoTrabalhoRepositoryPort repository;
    
    public List<SessaoTrabalhoDTO> executar(LocalDate dataInicio) {
        if (dataInicio != null) {
            return repository.buscarPorDataInicio(dataInicio).stream()
                .map(SessaoTrabalhoDTO::de)
                .toList();
        }
        
        return repository.buscarTodas().stream()
            .map(SessaoTrabalhoDTO::de)
            .toList();
    }
}

