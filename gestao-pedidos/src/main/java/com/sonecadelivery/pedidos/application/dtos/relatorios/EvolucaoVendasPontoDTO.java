package com.sonecadelivery.pedidos.application.dtos.relatorios;

public record EvolucaoVendasPontoDTO(
        String periodoId,
        String label,
        double totalVendas,
        long totalPedidos,
        double ticketMedio
) {
}

