package com.sonecadelivery.pedidos.domain.services;

import com.sonecadelivery.pedidos.domain.entities.Pedido;
import com.sonecadelivery.pedidos.domain.entities.StatusPedido;
import org.springframework.stereotype.Service;

import java.util.Set;

/**
 * Implementação do Domain Service de rastreamento.
 * Contém as regras de negócio puras sem dependências externas.
 */
@Service
public class RastreamentoPedidoServiceImpl implements RastreamentoPedidoService {
    
    /**
     * Status que permitem rastreamento.
     * Pedidos em PREPARANDO ou SAIU_PARA_ENTREGA podem ser rastreados.
     */
    private static final Set<StatusPedido> STATUS_PERMITIDOS_RASTREAMENTO = Set.of(
        StatusPedido.PREPARANDO,
        StatusPedido.SAIU_PARA_ENTREGA
    );
    
    @Override
    public boolean podeRastrear(Pedido pedido) {
        if (pedido == null) {
            return false;
        }
        
        return pedido.isPedidoDelivery()
            && pedido.getMotoboyId() != null
            && !pedido.getMotoboyId().isBlank()
            && STATUS_PERMITIDOS_RASTREAMENTO.contains(pedido.getStatus());
    }
    
    @Override
    public boolean clientePodeRastrear(Pedido pedido, String clienteId) {
        if (!podeRastrear(pedido)) {
            return false;
        }
        
        if (clienteId == null || clienteId.isBlank()) {
            return false;
        }
        
        return pedido.getClienteId() != null 
            && pedido.getClienteId().equals(clienteId);
    }
    
    @Override
    public boolean motoboyPodeEnviarLocalizacao(Pedido pedido, String motoboyId) {
        if (!podeRastrear(pedido)) {
            return false;
        }
        
        if (motoboyId == null || motoboyId.isBlank()) {
            return false;
        }
        
        return pedido.getMotoboyId() != null 
            && pedido.getMotoboyId().equals(motoboyId);
    }
}

