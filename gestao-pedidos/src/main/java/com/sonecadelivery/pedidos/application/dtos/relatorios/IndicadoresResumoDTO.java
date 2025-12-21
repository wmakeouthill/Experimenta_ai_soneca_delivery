package com.sonecadelivery.pedidos.application.dtos.relatorios;

public record IndicadoresResumoDTO(
        double totalFaturamento,
        long totalPedidos,
        double ticketMedio,
        double crescimentoPercentual
) {
}

