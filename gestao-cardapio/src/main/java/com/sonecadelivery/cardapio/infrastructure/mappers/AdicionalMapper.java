package com.sonecadelivery.cardapio.infrastructure.mappers;

import com.sonecadelivery.cardapio.domain.entities.Adicional;
import com.sonecadelivery.cardapio.domain.valueobjects.Preco;
import com.sonecadelivery.cardapio.infrastructure.persistence.AdicionalEntity;
import com.sonecadelivery.kernel.infrastructure.mappers.Mapper;
import org.springframework.stereotype.Component;

@Component
public class AdicionalMapper implements Mapper<Adicional, AdicionalEntity> {

    @Override
    public AdicionalEntity paraEntity(Adicional adicional) {
        if (adicional == null) {
            return null;
        }

        return AdicionalEntity.builder()
                .id(adicional.getId())
                .nome(adicional.getNome())
                .descricao(adicional.getDescricao())
                .preco(adicional.getPreco().getAmount())
                .categoria(adicional.getCategoria())
                .disponivel(adicional.estaDisponivel())
                .createdAt(adicional.getCreatedAt())
                .updatedAt(adicional.getUpdatedAt())
                .build();
    }

    @Override
    public Adicional paraDomain(AdicionalEntity entity) {
        if (entity == null) {
            return null;
        }

        Adicional adicional = Adicional.criar(
                entity.getNome(),
                entity.getDescricao(),
                Preco.of(entity.getPreco()),
                entity.getCategoria());

        // Restaura ID e timestamps do banco de dados
        adicional.restaurarDoBanco(entity.getId(), entity.getCreatedAt(), entity.getUpdatedAt());

        if (!entity.isDisponivel()) {
            adicional.marcarComoIndisponivel();
        }

        return adicional;
    }
}
