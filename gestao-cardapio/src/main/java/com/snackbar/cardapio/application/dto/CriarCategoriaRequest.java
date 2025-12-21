package com.snackbar.cardapio.application.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CriarCategoriaRequest {
    @NotBlank(message = "Nome da categoria é obrigatório")
    private String nome;
    
    private String descricao;
}

