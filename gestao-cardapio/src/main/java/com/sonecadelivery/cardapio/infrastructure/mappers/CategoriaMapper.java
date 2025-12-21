package com.sonecadelivery.cardapio.infrastructure.mappers;

import com.sonecadelivery.cardapio.domain.entities.Categoria;
import com.sonecadelivery.cardapio.infrastructure.persistence.CategoriaEntity;
import com.sonecadelivery.kernel.infrastructure.mappers.Mapper;
import org.springframework.stereotype.Component;

@Component
public class CategoriaMapper implements Mapper<Categoria, CategoriaEntity> {
    
    @Override
    public CategoriaEntity paraEntity(Categoria categoria) {
        if (categoria == null) {
            return null;
        }
        
        return CategoriaEntity.builder()
            .id(categoria.getId())
            .nome(categoria.getNome())
            .descricao(categoria.getDescricao())
            .ativa(categoria.estaAtiva())
            .createdAt(categoria.getCreatedAt())
            .updatedAt(categoria.getUpdatedAt())
            .build();
    }
    
    @Override
    public Categoria paraDomain(CategoriaEntity entity) {
        if (entity == null) {
            return null;
        }
        
        Categoria categoria = Categoria.criar(
            entity.getNome(),
            entity.getDescricao()
        );
        
        // Restaura ID e timestamps do banco de dados
        categoria.restaurarDoBanco(entity.getId(), entity.getCreatedAt(), entity.getUpdatedAt());
        
        if (!entity.isAtiva()) {
            categoria.desativar();
        }
        
        return categoria;
    }
}

