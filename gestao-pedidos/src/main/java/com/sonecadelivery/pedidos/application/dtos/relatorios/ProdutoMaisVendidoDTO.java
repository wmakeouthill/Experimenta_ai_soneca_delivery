package com.sonecadelivery.pedidos.application.dtos.relatorios;

public record ProdutoMaisVendidoDTO(
        String produtoId,
        String produtoNome,
        long quantidadeVendida,
        double valorTotal
) {
}

