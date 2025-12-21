package com.sonecadelivery.pedidos.application.dto;

import com.sonecadelivery.pedidos.domain.entities.ItemEstoque;
import com.sonecadelivery.pedidos.domain.entities.UnidadeMedida;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO para transferência de dados de item de estoque.
 */
@Getter
@Builder
public class ItemEstoqueDTO {
    private String id;
    private String nome;
    private String descricao;
    private BigDecimal quantidade;
    private BigDecimal quantidadeMinima;
    private String unidadeMedida;
    private String unidadeMedidaDescricao;
    private BigDecimal precoUnitario;
    private String fornecedor;
    private String codigoBarras;
    private boolean ativo;
    private boolean estoqueBaixo;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /**
     * Converte uma entidade de domínio para DTO.
     */
    public static ItemEstoqueDTO de(ItemEstoque item) {
        return ItemEstoqueDTO.builder()
                .id(item.getId())
                .nome(item.getNome())
                .descricao(item.getDescricao())
                .quantidade(item.getQuantidade())
                .quantidadeMinima(item.getQuantidadeMinima())
                .unidadeMedida(item.getUnidadeMedida().name())
                .unidadeMedidaDescricao(item.getUnidadeMedida().getDescricao())
                .precoUnitario(item.getPrecoUnitario())
                .fornecedor(item.getFornecedor())
                .codigoBarras(item.getCodigoBarras())
                .ativo(item.isAtivo())
                .estoqueBaixo(item.isEstoqueBaixo())
                .createdAt(item.getCreatedAt())
                .updatedAt(item.getUpdatedAt())
                .build();
    }
}

