package com.sonecadelivery.cardapio.application.dto;

import com.sonecadelivery.kernel.application.dto.BaseDTO;
import com.sonecadelivery.cardapio.domain.entities.Adicional;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;

@Data
@SuperBuilder
@EqualsAndHashCode(callSuper = true)
public class AdicionalDTO extends BaseDTO {
    private String nome;
    private String descricao;
    private BigDecimal preco;
    private String categoria;
    private boolean disponivel;

    public static AdicionalDTO de(Adicional adicional) {
        return AdicionalDTO.builder()
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
}
