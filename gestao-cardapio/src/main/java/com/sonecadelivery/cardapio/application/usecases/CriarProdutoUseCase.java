package com.sonecadelivery.cardapio.application.usecases;

import com.sonecadelivery.cardapio.application.dto.CriarProdutoRequest;
import com.sonecadelivery.cardapio.application.dto.ProdutoDTO;
import com.sonecadelivery.cardapio.application.ports.ProdutoRepositoryPort;
import com.sonecadelivery.cardapio.domain.entities.Produto;
import com.sonecadelivery.cardapio.domain.valueobjects.Preco;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CriarProdutoUseCase {
    
    private final ProdutoRepositoryPort produtoRepository;
    
    public ProdutoDTO executar(CriarProdutoRequest request) {
        Preco preco = Preco.of(request.getPreco());
        
        Produto produto = Produto.criar(
            request.getNome(),
            request.getDescricao(),
            preco,
            request.getCategoria(),
            request.getFoto()
        );
        
        @SuppressWarnings("null") // repository.salvar() nunca retorna null
        Produto produtoSalvo = produtoRepository.salvar(produto);
        
        return ProdutoDTO.de(produtoSalvo);
    }
}

