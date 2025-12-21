package com.sonecadelivery.cardapio.application.usecases;

import com.sonecadelivery.cardapio.application.dto.CategoriaDTO;
import com.sonecadelivery.cardapio.application.ports.CategoriaRepositoryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ListarCategoriasUseCase {
    
    private final CategoriaRepositoryPort categoriaRepository;
    
    public List<CategoriaDTO> executar() {
        return categoriaRepository.buscarTodas().stream()
            .map(CategoriaDTO::de)
            .toList();
    }
    
    public List<CategoriaDTO> executarAtivas() {
        return categoriaRepository.buscarAtivas().stream()
            .map(CategoriaDTO::de)
            .toList();
    }
}

