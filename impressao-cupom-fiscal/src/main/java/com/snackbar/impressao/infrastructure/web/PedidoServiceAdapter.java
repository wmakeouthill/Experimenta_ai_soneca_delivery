package com.snackbar.impressao.infrastructure.web;

import com.snackbar.impressao.application.ports.PedidoServicePort;
import com.snackbar.pedidos.application.dto.PedidoDTO;
import com.snackbar.pedidos.application.usecases.BuscarPedidoPorIdUseCase;
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

