package com.sonecadelivery.pedidos.infrastructure.persistence.mappers;

import com.sonecadelivery.pedidos.domain.entities.Mesa;
import com.sonecadelivery.pedidos.infrastructure.persistence.entities.MesaEntity;
import org.springframework.stereotype.Component;

/**
 * Mapper para conversão entre Mesa (domínio) e MesaEntity (persistência).
 */
@Component
public class MesaMapper {

    /**
     * Converte entidade de domínio para entidade JPA.
     */
    public MesaEntity paraEntity(Mesa mesa) {
        MesaEntity entity = new MesaEntity();
        entity.setId(mesa.getId());
        entity.setNumero(mesa.getNumero());
        entity.setNome(mesa.getNome());
        entity.setQrCodeToken(mesa.getQrCodeTokenValor());
        entity.setAtiva(mesa.isAtiva());
        entity.setCreatedAt(mesa.getCreatedAt());
        entity.setUpdatedAt(mesa.getUpdatedAt());
        return entity;
    }

    /**
     * Converte entidade JPA para entidade de domínio.
     */
    public Mesa paraDomain(MesaEntity entity) {
        return Mesa.restaurar(
                entity.getId(),
                entity.getNumero(),
                entity.getNome(),
                entity.getQrCodeToken(),
                entity.getAtiva(),
                entity.getCreatedAt(),
                entity.getUpdatedAt());
    }
}
