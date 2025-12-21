package com.sonecadelivery.impressao.infrastructure.web;

import com.sonecadelivery.impressao.application.ports.PedidoServicePort;
import com.sonecadelivery.pedidos.application.dto.PedidoDTO;
import com.sonecadelivery.pedidos.application.usecases.BuscarPedidoPorIdUseCase;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Objects;

@Component
@RequiredArgsConstructor
public class PedidoServiceAdapter implements PedidoServicePort {
    
    private final BuscarPedidoPorIdUseCase buscarPedidoPorIdUseCase;
    
    @Override
    public PedidoDTO buscarPedidoPorId(String pedidoId) {
        return buscarPedidoPorIdUseCase.executar(Objects.requireNonNull(pedidoId));
    }
}

