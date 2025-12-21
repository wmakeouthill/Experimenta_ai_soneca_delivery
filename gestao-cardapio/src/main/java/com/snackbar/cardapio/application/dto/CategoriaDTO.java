package com.snackbar.cardapio.application.dto;

import com.snackbar.kernel.application.dto.BaseDTO;
import com.snackbar.cardapio.domain.entities.Categoria;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.SuperBuilder;

@Data
@SuperBuilder
@EqualsAndHashCode(callSuper = true)
public class CategoriaDTO extends BaseDTO {
    private String nome;
    private String descricao;
    private boolean ativa;
    
    public static CategoriaDTO de(Categoria categoria) {
        return CategoriaDTO.builder()
            .id(categoria.getId())
            .nome(categoria.getNome())
            .descricao(categoria.getDescricao())
            .ativa(categoria.estaAtiva())
            .createdAt(categoria.getCreatedAt())
            .updatedAt(categoria.getUpdatedAt())
            .build();
    }
}

