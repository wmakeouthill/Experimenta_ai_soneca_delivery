package com.snackbar.impressao.application.ports;

import com.snackbar.pedidos.application.dto.PedidoDTO;

public interface PedidoServicePort {
    PedidoDTO buscarPedidoPorId(String pedidoId);
}

