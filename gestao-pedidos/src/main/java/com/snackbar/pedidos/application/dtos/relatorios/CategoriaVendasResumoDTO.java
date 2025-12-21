package com.snackbar.pedidos.application.dtos.relatorios;

public record CategoriaVendasResumoDTO(
        String categoriaId,
        String categoriaNome,
        double valorTotal,
        long quantidadePedidos
) {
}

