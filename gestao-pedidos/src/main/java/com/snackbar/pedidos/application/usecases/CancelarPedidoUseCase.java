package com.snackbar.pedidos.application.usecases;

import com.snackbar.pedidos.application.dto.PedidoDTO;
import com.snackbar.pedidos.application.ports.PedidoRepositoryPort;
import com.snackbar.pedidos.domain.entities.Pedido;
import com.snackbar.pedidos.domain.services.PedidoValidator;
import com.snackbar.kernel.domain.exceptions.ValidationException;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CancelarPedidoUseCase {
    
    private final PedidoRepositoryPort pedidoRepository;
    private final PedidoValidator pedidoValidator;
    
    @SuppressWarnings("null") // repository.salvar() nunca retorna null, .orElseThrow() nunca retorna null
    public PedidoDTO executar(@NonNull String id) {
        Pedido pedido = pedidoRepository.buscarPorId(id)
            .orElseThrow(() -> new ValidationException("Pedido não encontrado com ID: " + id));
        
        pedidoValidator.validarCancelamento(pedido);
        pedido.cancelar();
        
        Pedido pedidoCancelado = pedidoRepository.salvar(pedido);
        
        return PedidoDTO.de(pedidoCancelado);
    }
}

