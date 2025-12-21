package com.snackbar.pedidos.infrastructure.mappers;

import com.snackbar.pedidos.domain.entities.Motoboy;
import com.snackbar.pedidos.infrastructure.persistence.MotoboyEntity;

import java.time.LocalDateTime;

/**
 * Mapper para conversão entre Motoboy (domain) e MotoboyEntity (persistence).
 */
public final class MotoboyMapper {

    private MotoboyMapper() {
        // Utility class
    }

    /**
     * Converte entidade JPA para entidade de domínio.
     */
    public static Motoboy toDomain(MotoboyEntity entity) {
        if (entity == null) {
            return null;
        }

        Motoboy motoboy = Motoboy.restaurarDoBanco(
                entity.getNome(),
                entity.getTelefone(),
                entity.getVeiculo(),
                entity.getPlaca(),
                entity.getAtivo());

        motoboy.setId(entity.getId());
        motoboy.setCreatedAt(entity.getCreatedAt());
        motoboy.setUpdatedAt(entity.getUpdatedAt());

        return motoboy;
    }

    /**
     * Converte entidade de domínio para entidade JPA.
     */
    public static MotoboyEntity toEntity(Motoboy motoboy) {
        if (motoboy == null) {
            return null;
        }

        return MotoboyEntity.builder()
                .id(motoboy.getId())
                .nome(motoboy.getNome())
                .telefone(motoboy.getTelefone())
                .veiculo(motoboy.getVeiculo())
                .placa(motoboy.getPlaca())
                .ativo(motoboy.isAtivo())
                .createdAt(motoboy.getCreatedAt() != null ? motoboy.getCreatedAt() : LocalDateTime.now())
                .updatedAt(motoboy.getUpdatedAt() != null ? motoboy.getUpdatedAt() : LocalDateTime.now())
                .build();
    }
}
