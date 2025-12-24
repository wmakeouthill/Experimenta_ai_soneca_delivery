package com.sonecadelivery.pedidos.application.ports;

import com.sonecadelivery.pedidos.domain.entities.Motoboy;

/**
 * Port para serviço de JWT de Motoboy.
 */
public interface MotoboyJwtServicePort {

    /**
     * Gera um token JWT para o motoboy.
     */
    String gerarToken(Motoboy motoboy);

    /**
     * Extrai o ID do motoboy do token.
     */
    String extrairMotoboyId(String token);

    /**
     * Valida se o token é válido.
     */
    boolean validarToken(String token);
}

