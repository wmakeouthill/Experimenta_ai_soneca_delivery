package com.sonecadelivery.pedidos.infrastructure.mappers;

import com.sonecadelivery.pedidos.domain.entities.MovimentacaoCaixa;
import com.sonecadelivery.pedidos.infrastructure.persistence.MovimentacaoCaixaEntity;
import org.springframework.stereotype.Component;

/**
 * Mapper para conversão entre MovimentacaoCaixa (domain) e MovimentacaoCaixaEntity (persistence).
 */
@Component
public class MovimentacaoCaixaMapper {

    public MovimentacaoCaixaEntity paraEntity(MovimentacaoCaixa movimentacao) {
        return MovimentacaoCaixaEntity.builder()
                .id(movimentacao.getId())
                .sessaoId(movimentacao.getSessaoId())
                .usuarioId(movimentacao.getUsuarioId())
                .tipo(movimentacao.getTipo())
                .valor(movimentacao.getValor())
                .descricao(movimentacao.getDescricao())
                .dataMovimentacao(movimentacao.getDataMovimentacao())
                .createdAt(movimentacao.getCreatedAt())
                .updatedAt(movimentacao.getUpdatedAt())
                .build();
    }

    public MovimentacaoCaixa paraDomain(MovimentacaoCaixaEntity entity) {
        return MovimentacaoCaixa.restaurarDoBancoFactory(
                entity.getId(),
                entity.getSessaoId(),
                entity.getUsuarioId(),
                entity.getTipo(),
                entity.getValor(),
                entity.getDescricao(),
                entity.getDataMovimentacao(),
                entity.getCreatedAt(),
                entity.getUpdatedAt());
    }
}

