package com.sonecadelivery.cardapio.application.dto;

import lombok.Data;

@Data
public class AtualizarCategoriaRequest {
    private String nome;
    private String descricao;
    private Boolean ativa;
}

