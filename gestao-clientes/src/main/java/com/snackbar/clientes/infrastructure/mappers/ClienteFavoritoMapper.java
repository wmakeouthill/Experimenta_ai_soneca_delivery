package com.snackbar.clientes.infrastructure.mappers;

import com.snackbar.clientes.domain.entities.ClienteFavorito;
import com.snackbar.clientes.infrastructure.persistence.ClienteFavoritoEntity;
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
