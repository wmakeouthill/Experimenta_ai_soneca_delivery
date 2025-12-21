package com.sonecadelivery.pedidos.application.usecases;

import com.sonecadelivery.pedidos.application.dto.PedidoDTO;
import com.sonecadelivery.pedidos.application.ports.PedidoRepositoryPort;
import com.sonecadelivery.pedidos.domain.entities.Pedido;
import com.sonecadelivery.pedidos.domain.services.PedidoValidator;
import com.sonecadelivery.kernel.domain.exceptions.ValidationException;
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

