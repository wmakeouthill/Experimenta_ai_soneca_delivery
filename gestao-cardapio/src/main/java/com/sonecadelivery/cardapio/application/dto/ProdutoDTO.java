package com.sonecadelivery.cardapio.application.dto;

import com.sonecadelivery.kernel.application.dto.BaseDTO;
import com.sonecadelivery.cardapio.domain.entities.Produto;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;

@Data
@SuperBuilder
@EqualsAndHashCode(callSuper = true)
public class ProdutoDTO extends BaseDTO {
    private String nome;
    private String descricao;
    private BigDecimal preco;
    private String categoria;
    private boolean disponivel;
    private String foto; // Base64 string da imagem
    
    public static ProdutoDTO de(Produto produto) {
        return ProdutoDTO.builder()
            .id(produto.getId())
            .nome(produto.getNome())
            .descricao(produto.getDescricao())
            .preco(produto.getPreco().getAmount())
            .categoria(produto.getCategoria())
            .disponivel(produto.estaDisponivel())
            .foto(produto.getFoto())
            .createdAt(produto.getCreatedAt())
            .updatedAt(produto.getUpdatedAt())
            .build();
    }
}

