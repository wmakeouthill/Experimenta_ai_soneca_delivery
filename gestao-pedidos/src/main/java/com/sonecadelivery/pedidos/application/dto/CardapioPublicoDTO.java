package com.sonecadelivery.pedidos.application.dto;

import java.util.List;

/**
 * DTO para retornar o cardápio público.
 * Contém categorias ativas e produtos disponíveis.
 */
public record CardapioPublicoDTO(
        List<CategoriaPublicaDTO> categorias,
        List<ProdutoPublicoDTO> produtos) {

    public record CategoriaPublicaDTO(
            String id,
            String nome,
            String descricao,
            boolean ativa) {
    }

    public record ProdutoPublicoDTO(
            String id,
            String nome,
            String descricao,
            double preco,
            String categoria,
            boolean disponivel,
            String foto) {
    }
}
