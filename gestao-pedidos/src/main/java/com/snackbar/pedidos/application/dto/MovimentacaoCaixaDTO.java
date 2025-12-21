package com.snackbar.pedidos.application.dto;

import com.snackbar.pedidos.domain.entities.MovimentacaoCaixa;
import com.snackbar.pedidos.domain.entities.TipoMovimentacaoCaixa;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO para movimentação de caixa (sangria e suprimento).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MovimentacaoCaixaDTO {
    private String id;
    private String sessaoId;
    private String usuarioId;
    private TipoMovimentacaoCaixa tipo;
    private String tipoDescricao;
    private BigDecimal valor;
    private String descricao;
    private LocalDateTime dataMovimentacao;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    public static MovimentacaoCaixaDTO de(MovimentacaoCaixa movimentacao) {
        return MovimentacaoCaixaDTO.builder()
            .id(movimentacao.getId())
            .sessaoId(movimentacao.getSessaoId())
            .usuarioId(movimentacao.getUsuarioId())
            .tipo(movimentacao.getTipo())
            .tipoDescricao(movimentacao.getTipo().getDescricao())
            .valor(movimentacao.getValor())
            .descricao(movimentacao.getDescricao())
            .dataMovimentacao(movimentacao.getDataMovimentacao())
            .createdAt(movimentacao.getCreatedAt())
            .updatedAt(movimentacao.getUpdatedAt())
            .build();
    }
}

