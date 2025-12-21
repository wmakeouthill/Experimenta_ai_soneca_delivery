package com.snackbar.pedidos.application.dtos.relatorios;

public record QuantidadePorCategoriaDTO(
        String categoriaId,
        String categoriaNome,
        long quantidadeVendida) {
}
