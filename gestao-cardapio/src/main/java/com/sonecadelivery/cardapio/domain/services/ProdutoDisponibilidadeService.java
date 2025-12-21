package com.sonecadelivery.cardapio.domain.services;

import com.sonecadelivery.cardapio.domain.entities.Produto;
import java.util.List;

public class ProdutoDisponibilidadeService {
    
    public void marcarProdutosComoIndisponiveis(List<Produto> produtos) {
        if (produtos == null) {
            return;
        }
        produtos.forEach(Produto::marcarComoIndisponivel);
    }
    
    public long contarProdutosDisponiveis(List<Produto> produtos) {
        if (produtos == null) {
            return 0;
        }
        return produtos.stream()
            .filter(Produto::estaDisponivel)
            .count();
    }
    
    public boolean todosProdutosDisponiveis(List<Produto> produtos) {
        if (produtos == null || produtos.isEmpty()) {
            return false;
        }
        return produtos.stream()
            .allMatch(Produto::estaDisponivel);
    }
}

