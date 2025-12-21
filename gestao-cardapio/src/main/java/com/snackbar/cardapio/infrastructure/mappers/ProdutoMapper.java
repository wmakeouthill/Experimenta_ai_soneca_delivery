package com.snackbar.cardapio.infrastructure.mappers;

import com.snackbar.cardapio.domain.entities.Produto;
import com.snackbar.cardapio.domain.valueobjects.Preco;
import com.snackbar.cardapio.infrastructure.persistence.ProdutoEntity;
import com.snackbar.kernel.infrastructure.mappers.Mapper;
import org.springframework.stereotype.Component;

@Component
public class ProdutoMapper implements Mapper<Produto, ProdutoEntity> {
    
    @Override
    public ProdutoEntity paraEntity(Produto produto) {
        if (produto == null) {
            return null;
        }
        
        return ProdutoEntity.builder()
            .id(produto.getId())
            .nome(produto.getNome())
            .descricao(produto.getDescricao())
            .preco(produto.getPreco().getAmount())
            .categoria(produto.getCategoria())
            .disponivel(produto.estaDisponivel())
            .foto(produto.getFoto())
            .createdAt(produto.getCreatedAt())
            .updatedAt(produto.getUpdatedAt())
            .build();
    }
    
    @Override
    public Produto paraDomain(ProdutoEntity entity) {
        if (entity == null) {
            return null;
        }
        
        Produto produto = Produto.criar(
            entity.getNome(),
            entity.getDescricao(),
            Preco.of(entity.getPreco()),
            entity.getCategoria(),
            entity.getFoto()
        );
        
        // Restaura ID e timestamps do banco de dados
        produto.restaurarDoBanco(entity.getId(), entity.getCreatedAt(), entity.getUpdatedAt());
        
        if (!entity.isDisponivel()) {
            produto.marcarComoIndisponivel();
        }
        
        return produto;
    }
}

