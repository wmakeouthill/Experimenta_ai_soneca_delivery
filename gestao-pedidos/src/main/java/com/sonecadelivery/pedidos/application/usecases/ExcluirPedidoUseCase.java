package com.sonecadelivery.pedidos.application.usecases;

import com.sonecadelivery.pedidos.application.ports.PedidoRepositoryPort;
import com.sonecadelivery.kernel.domain.exceptions.ValidationException;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ExcluirPedidoUseCase {
    
    private final PedidoRepositoryPort pedidoRepository;
    
    public void executar(@NonNull String id) {
        if (id == null || id.trim().isEmpty()) {
            throw new ValidationException("ID do pedido não pode ser nulo ou vazio");
        }
        
        pedidoRepository.buscarPorId(id)
            .orElseThrow(() -> new ValidationException("Pedido não encontrado com ID: " + id));
        
        pedidoRepository.excluir(id);
    }
}

