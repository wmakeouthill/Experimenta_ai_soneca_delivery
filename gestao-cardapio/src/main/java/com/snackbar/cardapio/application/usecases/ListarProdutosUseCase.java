package com.snackbar.cardapio.application.usecases;

import com.snackbar.cardapio.application.dto.ProdutoDTO;
import com.snackbar.cardapio.application.ports.ProdutoRepositoryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ListarProdutosUseCase {
    
    private final ProdutoRepositoryPort produtoRepository;
    
    public List<ProdutoDTO> executar() {
        return produtoRepository.buscarTodos().stream()
            .map(ProdutoDTO::de)
            .toList();
    }
    
    public List<ProdutoDTO> executarPorCategoria(String categoria) {
        return produtoRepository.buscarPorCategoria(categoria).stream()
            .map(ProdutoDTO::de)
            .toList();
    }
    
    public List<ProdutoDTO> executarDisponiveis() {
        return produtoRepository.buscarDisponiveis().stream()
            .map(ProdutoDTO::de)
            .toList();
    }
}

