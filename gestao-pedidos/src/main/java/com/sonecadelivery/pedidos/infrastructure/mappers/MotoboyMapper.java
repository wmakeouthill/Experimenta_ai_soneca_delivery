package com.sonecadelivery.pedidos.infrastructure.mappers;

import com.sonecadelivery.pedidos.domain.entities.Motoboy;
import com.sonecadelivery.pedidos.infrastructure.persistence.MotoboyEntity;

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

        Motoboy motoboy;

        // Se tem Google ID, criar via Google OAuth
        if (entity.getGoogleId() != null) {
            motoboy = Motoboy.criarViaGoogle(
                    entity.getNome(),
                    entity.getEmail(),
                    entity.getGoogleId(),
                    entity.getFotoUrl());
        } else {
            // Criação normal (pode não ter telefone se foi criado manualmente sem validação)
            motoboy = Motoboy.criar(
                    entity.getNome(),
                    entity.getTelefone() != null ? entity.getTelefone() : "",
                    entity.getVeiculo(),
                    entity.getPlaca());
        }

        // Restaurar ID e timestamps
        motoboy.restaurarDoBanco(
                entity.getId(),
                entity.getCreatedAt(),
                entity.getUpdatedAt());

        // Restaurar dados básicos
        motoboy.restaurarDadosBasicosDoBanco(
                entity.getApelido(),
                entity.getTelefone(),
                entity.getVeiculo(),
                entity.getPlaca(),
                entity.getAtivo() != null ? entity.getAtivo() : true);

        // Restaurar autenticação
        motoboy.restaurarAutenticacaoDoBanco(
                entity.getGoogleId(),
                entity.getEmail(),
                entity.getFotoUrl(),
                entity.getUltimoLogin());

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
                .apelido(motoboy.getApelido())
                .telefone(motoboy.getTelefone())
                .veiculo(motoboy.getVeiculo())
                .placa(motoboy.getPlaca())
                .ativo(motoboy.isAtivo())
                .googleId(motoboy.getGoogleId())
                .email(motoboy.getEmail())
                .fotoUrl(motoboy.getFotoUrl())
                .ultimoLogin(motoboy.getUltimoLogin())
                .createdAt(motoboy.getCreatedAt() != null ? motoboy.getCreatedAt() : LocalDateTime.now())
                .updatedAt(motoboy.getUpdatedAt() != null ? motoboy.getUpdatedAt() : LocalDateTime.now())
                .build();
    }
}
