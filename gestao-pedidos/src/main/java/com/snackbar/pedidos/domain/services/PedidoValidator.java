package com.snackbar.pedidos.domain.services;

import com.snackbar.kernel.domain.exceptions.ValidationException;
import com.snackbar.pedidos.domain.entities.Pedido;
import com.snackbar.pedidos.domain.entities.StatusPedido;
import org.springframework.stereotype.Service;

@Service
public class PedidoValidator {
    
    public void validarCriacao(Pedido pedido) {
        if (pedido.getItens().isEmpty()) {
            throw new ValidationException("Pedido deve ter pelo menos um item");
        }
    }
    
    public void validarAtualizacaoStatus(Pedido pedido, StatusPedido novoStatus) {
        if (!pedido.getStatus().podeSerAtualizadoPara(novoStatus)) {
            throw new ValidationException(
                "Não é possível atualizar o status de " + 
                pedido.getStatus().getDescricao() + 
                " para " + novoStatus.getDescricao()
            );
        }
    }
    
    public void validarCancelamento(Pedido pedido) {
        // Permite cancelar pedidos finalizados para casos especiais
        // Apenas verifica se o pedido não está já cancelado
        if (pedido.estaCancelado()) {
            throw new ValidationException("Pedido já está cancelado");
        }
    }
}

