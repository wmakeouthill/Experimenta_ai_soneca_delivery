package com.snackbar.pedidos.application.dtos.relatorios;

public record DistribuicaoClientesDTO(
        String clienteId,
        String clienteNome,
        double valorTotal,
        long quantidadePedidos
) {
}

