package com.snackbar.pedidos.application.dtos.relatorios;

public record PedidosPorHorarioDTO(
        String horaReferencia,
        long quantidadePedidos,
        double valorTotal) {
}
