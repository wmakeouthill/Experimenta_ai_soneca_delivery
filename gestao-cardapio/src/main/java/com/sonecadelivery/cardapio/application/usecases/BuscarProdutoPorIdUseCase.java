package com.sonecadelivery.cardapio.application.usecases;

import com.sonecadelivery.cardapio.application.dto.ProdutoDTO;
import com.sonecadelivery.cardapio.application.ports.ProdutoRepositoryPort;
import com.sonecadelivery.kernel.domain.exceptions.ValidationException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class BuscarProdutoPorIdUseCase {
    
    private final ProdutoRepositoryPort produtoRepository;
    
    public ProdutoDTO executar(String id) {
        if (id == null || id.trim().isEmpty()) {
            throw new ValidationException("ID do produto não pode ser nulo ou vazio");
        }
        
        return produtoRepository.buscarPorId(id)
            .map(ProdutoDTO::de)
            .orElseThrow(() -> new ValidationException("Produto não encontrado com ID: " + id));
    }
}

