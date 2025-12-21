package com.sonecadelivery.clientes.application.ports;

import com.sonecadelivery.clientes.domain.entities.Cliente;

public interface ClienteJwtServicePort {

    /**
     * Gera um token JWT para o cliente
     */
    String gerarToken(Cliente cliente);

    /**
     * Extrai o ID do cliente do token
     */
    String extrairClienteId(String token);

    /**
     * Valida se o token é válido
     */
    boolean validarToken(String token);

    /**
     * Extrai o telefone do cliente do token
     */
    String extrairTelefone(String token);
}
