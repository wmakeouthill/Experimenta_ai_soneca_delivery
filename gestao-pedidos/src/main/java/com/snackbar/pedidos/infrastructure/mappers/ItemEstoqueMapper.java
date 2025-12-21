package com.snackbar.pedidos.infrastructure.mappers;

import com.snackbar.pedidos.domain.entities.ItemEstoque;
import com.snackbar.pedidos.infrastructure.persistence.ItemEstoqueEntity;
import org.springframework.stereotype.Component;

/**
 * Mapper para conversão entre ItemEstoque (domínio) e ItemEstoqueEntity (JPA).
 */
@Component
public class ItemEstoqueMapper {
    
    /**
     * Converte uma entidade JPA para entidade de domínio.
     */
    public ItemEstoque paraDomain(ItemEstoqueEntity entity) {
        if (entity == null) {
            return null;
        }
        
        return ItemEstoque.restaurarDoBancoFactory(
                entity.getId(),
                entity.getNome(),
                entity.getDescricao(),
                entity.getQuantidade(),
                entity.getQuantidadeMinima(),
                entity.getUnidadeMedida(),
                entity.getPrecoUnitario(),
                entity.getFornecedor(),
                entity.getCodigoBarras(),
                entity.isAtivo(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
    
    /**
     * Converte uma entidade de domínio para entidade JPA.
     */
    public ItemEstoqueEntity paraEntity(ItemEstoque item) {
        if (item == null) {
            return null;
        }
        
        return ItemEstoqueEntity.builder()
                .id(item.getId())
                .nome(item.getNome())
                .descricao(item.getDescricao())
                .quantidade(item.getQuantidade())
                .quantidadeMinima(item.getQuantidadeMinima())
                .unidadeMedida(item.getUnidadeMedida())
                .precoUnitario(item.getPrecoUnitario())
                .fornecedor(item.getFornecedor())
                .codigoBarras(item.getCodigoBarras())
                .ativo(item.isAtivo())
                .createdAt(item.getCreatedAt())
                .updatedAt(item.getUpdatedAt())
                .build();
    }
}

