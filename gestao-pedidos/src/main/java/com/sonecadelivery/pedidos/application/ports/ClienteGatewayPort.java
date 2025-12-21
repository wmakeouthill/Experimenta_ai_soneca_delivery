package com.sonecadelivery.pedidos.application.ports;

import com.sonecadelivery.pedidos.application.dto.ClientePublicoDTO;

import java.util.Optional;

/**
 * Port para acesso ao serviço de clientes.
 * Permite buscar e cadastrar clientes a partir do módulo de pedidos.
 */
public interface ClienteGatewayPort {

    /**
     * Busca cliente por telefone.
     * 
     * @param telefone Telefone do cliente (apenas dígitos)
     * @return Cliente encontrado ou Optional vazio
     */
    Optional<ClientePublicoDTO> buscarPorTelefone(String telefone);

    /**
     * Cadastra novo cliente.
     * 
     * @param nome     Nome do cliente
     * @param telefone Telefone do cliente (apenas dígitos)
     * @return Cliente cadastrado
     */
    ClientePublicoDTO cadastrar(String nome, String telefone);

    /**
     * Busca cliente por ID.
     * 
     * @param id ID do cliente
     * @return Cliente encontrado ou Optional vazio
     */
    Optional<ClientePublicoDTO> buscarPorId(String id);
}
