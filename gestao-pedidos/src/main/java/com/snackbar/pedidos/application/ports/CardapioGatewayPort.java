package com.snackbar.pedidos.application.ports;

import com.snackbar.pedidos.application.dto.CardapioPublicoDTO;

/**
 * Port para acessar o cardápio público (categorias e produtos).
 */
public interface CardapioGatewayPort {
    
    /**
     * Busca o cardápio público com categorias ativas e produtos disponíveis.
     */
    CardapioPublicoDTO buscarCardapioPublico();
}
