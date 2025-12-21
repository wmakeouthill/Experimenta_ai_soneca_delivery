package com.sonecadelivery.impressao.application.ports;

import com.sonecadelivery.pedidos.application.dto.PedidoDTO;

public interface PedidoServicePort {
    PedidoDTO buscarPedidoPorId(String pedidoId);
}

