package com.sonecadelivery.pedidos.application.dto;

import java.math.BigDecimal;

/**
 * DTO para produtos populares (mais pedidos, mais favoritados ou mais bem
 * avaliados).
 */
public record ProdutoPopularDTO(
        String id,
        String nome,
        String descricao,
        BigDecimal preco,
        String foto,
        String categoriaNome,
        Long quantidadeVendida,
        Long quantidadeFavoritos,
        Double mediaAvaliacao,
        Integer totalAvaliacoes) {
    /**
     * Construtor para produtos mais pedidos (sem avaliação)
     */
    public static ProdutoPopularDTO maisPedido(
            String id, String nome, String descricao, BigDecimal preco,
            String foto, String categoriaNome, Long quantidadeVendida) {
        return new ProdutoPopularDTO(id, nome, descricao, preco, foto, categoriaNome, quantidadeVendida, null, null,
                null);
    }

    /**
     * Construtor para produtos mais favoritados
     */
    public static ProdutoPopularDTO maisFavoritado(
            String id, String nome, String descricao, BigDecimal preco,
            String foto, String categoriaNome, Long quantidadeFavoritos) {
        return new ProdutoPopularDTO(id, nome, descricao, preco, foto, categoriaNome, null, quantidadeFavoritos, null,
                null);
    }

    /**
     * Construtor para produtos bem avaliados
     */
    public static ProdutoPopularDTO bemAvaliado(
            String id, String nome, String descricao, BigDecimal preco,
            String foto, String categoriaNome, Double mediaAvaliacao, Integer totalAvaliacoes) {
        return new ProdutoPopularDTO(id, nome, descricao, preco, foto, categoriaNome, null, null, mediaAvaliacao,
                totalAvaliacoes);
    }
}
