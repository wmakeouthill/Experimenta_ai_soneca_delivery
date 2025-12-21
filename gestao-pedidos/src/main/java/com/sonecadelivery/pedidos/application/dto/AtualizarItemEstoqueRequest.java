package com.sonecadelivery.pedidos.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * Request para atualização de um item de estoque existente.
 */
@Getter
@Setter
public class AtualizarItemEstoqueRequest {
    
    @NotBlank(message = "Nome é obrigatório")
    @Size(max = 150, message = "Nome deve ter no máximo 150 caracteres")
    private String nome;
    
    @Size(max = 500, message = "Descrição deve ter no máximo 500 caracteres")
    private String descricao;
    
    @PositiveOrZero(message = "Quantidade deve ser maior ou igual a zero")
    private BigDecimal quantidade;
    
    @PositiveOrZero(message = "Quantidade mínima deve ser maior ou igual a zero")
    private BigDecimal quantidadeMinima;
    
    @NotNull(message = "Unidade de medida é obrigatória")
    private String unidadeMedida;
    
    @PositiveOrZero(message = "Preço unitário deve ser maior ou igual a zero")
    private BigDecimal precoUnitario;
    
    @Size(max = 200, message = "Fornecedor deve ter no máximo 200 caracteres")
    private String fornecedor;
    
    @Size(max = 50, message = "Código de barras deve ter no máximo 50 caracteres")
    private String codigoBarras;
    
    @NotNull(message = "Status ativo é obrigatório")
    private Boolean ativo;
}

