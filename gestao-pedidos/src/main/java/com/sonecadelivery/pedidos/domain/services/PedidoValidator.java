package com.sonecadelivery.pedidos.domain.services;

import com.sonecadelivery.kernel.domain.exceptions.ValidationException;
import com.sonecadelivery.pedidos.domain.entities.Pedido;
import com.sonecadelivery.pedidos.domain.entities.StatusPedido;
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
    
    /**
     * Valida se o motoboy pode finalizar o pedido.
     * Apenas o motoboy atribuído ao pedido pode finalizá-lo.
     * Se o pedido não tem motoboy atribuído, qualquer usuário pode finalizar (operador/admin).
     */
    public void validarFinalizacaoPorMotoboy(Pedido pedido, String motoboyIdRequisicao) {
        if (pedido.getMotoboyId() == null || pedido.getMotoboyId().isBlank()) {
            // Pedido sem motoboy - pode ser finalizado por qualquer usuário autorizado
            return;
        }
        
        if (motoboyIdRequisicao == null || motoboyIdRequisicao.isBlank()) {
            // Requisição sem motoboyId - permite (pode ser operador/admin)
            return;
        }
        
        // Se o pedido tem motoboy e a requisição veio de um motoboy, verifica se é o mesmo
        if (!pedido.getMotoboyId().equals(motoboyIdRequisicao)) {
            throw new ValidationException(
                "Apenas o motoboy atribuído ao pedido pode finalizá-lo"
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

