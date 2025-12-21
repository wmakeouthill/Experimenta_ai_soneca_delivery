package com.sonecadelivery.pedidos.application.dtos.relatorios;

public record DistribuicaoHorariaDTO(
        String horaReferencia,
        double valorTotal,
        long quantidadePedidos
) {
}

