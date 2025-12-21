package com.snackbar.pedidos.application.usecases;

import com.snackbar.kernel.domain.exceptions.ValidationException;
import com.snackbar.pedidos.application.ports.ItemEstoqueRepositoryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * Use case para excluir um item de estoque.
 */
@Service
@RequiredArgsConstructor
public class ExcluirItemEstoqueUseCase {
    
    private final ItemEstoqueRepositoryPort repository;
    
    public void executar(String id) {
        if (repository.buscarPorId(id).isEmpty()) {
            throw new ValidationException("Item de estoque não encontrado: " + id);
        }
        
        repository.remover(id);
    }
}

