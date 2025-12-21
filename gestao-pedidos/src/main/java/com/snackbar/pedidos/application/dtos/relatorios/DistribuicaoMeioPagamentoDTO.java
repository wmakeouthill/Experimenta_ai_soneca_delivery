package com.snackbar.pedidos.application.dtos.relatorios;

public record DistribuicaoMeioPagamentoDTO(
        String meioPagamento,
        double valorTotal,
        long quantidadePedidos
) {
}

