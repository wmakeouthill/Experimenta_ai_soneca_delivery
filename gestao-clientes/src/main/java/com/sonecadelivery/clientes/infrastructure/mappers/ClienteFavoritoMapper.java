package com.sonecadelivery.clientes.infrastructure.mappers;

import com.sonecadelivery.clientes.domain.entities.ClienteFavorito;
import com.sonecadelivery.clientes.infrastructure.persistence.ClienteFavoritoEntity;
import org.springframework.stereotype.Component;

@Component
public class ClienteFavoritoMapper {

    public ClienteFavoritoEntity paraEntity(ClienteFavorito favorito) {
        return ClienteFavoritoEntity.builder()
                .id(favorito.getId())
                .clienteId(favorito.getClienteId())
                .produtoId(favorito.getProdutoId())
                .createdAt(favorito.getCreatedAt())
                .build();
    }

    public ClienteFavorito paraDomain(ClienteFavoritoEntity entity) {
        return ClienteFavorito.reconstruir(
                entity.getId(),
                entity.getClienteId(),
                entity.getProdutoId(),
                entity.getCreatedAt());
    }
}
