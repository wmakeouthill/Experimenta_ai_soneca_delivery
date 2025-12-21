package com.sonecadelivery.cardapio.application.usecases;

import com.sonecadelivery.cardapio.application.ports.ProdutoRepositoryPort;
import com.sonecadelivery.kernel.domain.exceptions.ValidationException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ExcluirProdutoUseCase {
    
    private final ProdutoRepositoryPort produtoRepository;
    
    public void executar(String id) {
        if (id == null || id.trim().isEmpty()) {
            throw new ValidationException("ID do produto não pode ser nulo ou vazio");
        }
        
        if (!produtoRepository.existePorId(id)) {
            throw new ValidationException("Produto não encontrado com ID: " + id);
        }
        
        produtoRepository.excluir(id);
    }
}

