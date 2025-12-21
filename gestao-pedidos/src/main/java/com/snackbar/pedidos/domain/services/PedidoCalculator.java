package com.snackbar.pedidos.domain.services;

import com.snackbar.cardapio.domain.valueobjects.Preco;
import com.snackbar.pedidos.domain.entities.ItemPedido;
import com.snackbar.pedidos.domain.entities.Pedido;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PedidoCalculator {
    
    public Preco calcularValorTotal(List<ItemPedido> itens) {
        Preco total = Preco.zero();
        for (ItemPedido item : itens) {
            total = total.add(item.calcularSubtotal());
        }
        return total;
    }
    
    public int contarItens(Pedido pedido) {
        return pedido.getItens().size();
    }
    
    public int contarQuantidadeTotal(Pedido pedido) {
        return pedido.getItens().stream()
            .mapToInt(ItemPedido::getQuantidade)
            .sum();
    }
}

