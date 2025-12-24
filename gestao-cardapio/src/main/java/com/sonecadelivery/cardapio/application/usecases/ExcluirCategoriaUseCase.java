package com.sonecadelivery.cardapio.application.usecases;

import com.sonecadelivery.cardapio.application.ports.CategoriaRepositoryPort;
import com.sonecadelivery.kernel.domain.exceptions.ValidationException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ExcluirCategoriaUseCase {
    
    private final CategoriaRepositoryPort categoriaRepository;
    
    public void executar(String id) {
        if (id == null || id.trim().isEmpty()) {
            throw new ValidationException("ID da categoria não pode ser nulo ou vazio");
        }
        
        if (!categoriaRepository.existePorId(id)) {
            throw new ValidationException("Categoria não encontrada com ID: " + id);
        }
        
        categoriaRepository.excluir(id);
    }
}

