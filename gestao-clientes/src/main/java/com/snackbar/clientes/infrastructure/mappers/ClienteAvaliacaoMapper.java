package com.snackbar.clientes.infrastructure.mappers;

import com.snackbar.clientes.domain.entities.ClienteAvaliacao;
import com.snackbar.clientes.infrastructure.persistence.ClienteAvaliacaoEntity;
import org.springframework.stereotype.Component;

@Component
public class ClienteAvaliacaoMapper {

    public ClienteAvaliacaoEntity paraEntity(ClienteAvaliacao avaliacao) {
        return ClienteAvaliacaoEntity.builder()
                .id(avaliacao.getId())
                .clienteId(avaliacao.getClienteId())
                .produtoId(avaliacao.getProdutoId())
                .pedidoId(avaliacao.getPedidoId())
                .nota(avaliacao.getNota())
                .comentario(avaliacao.getComentario())
                .createdAt(avaliacao.getCreatedAt())
                .updatedAt(avaliacao.getUpdatedAt())
                .build();
    }

    public ClienteAvaliacao paraDomain(ClienteAvaliacaoEntity entity) {
        return ClienteAvaliacao.reconstruir(
                entity.getId(),
                entity.getClienteId(),
                entity.getProdutoId(),
                entity.getPedidoId(),
                entity.getNota(),
                entity.getComentario(),
                entity.getCreatedAt(),
                entity.getUpdatedAt());
    }
}
