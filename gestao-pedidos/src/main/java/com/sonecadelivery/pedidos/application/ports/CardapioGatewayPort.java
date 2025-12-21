package com.sonecadelivery.pedidos.application.ports;

import com.sonecadelivery.pedidos.application.dto.CardapioPublicoDTO;

/**
 * Port para acessar o cardápio público (categorias e produtos).
 */
public interface CardapioGatewayPort {
    
    /**
     * Busca o cardápio público com categorias ativas e produtos disponíveis.
     */
    CardapioPublicoDTO buscarCardapioPublico();
}
