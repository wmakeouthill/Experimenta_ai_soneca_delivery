package com.sonecadelivery.clientes.application.ports;

public interface ClienteSenhaServicePort {

    /**
     * Cria o hash da senha
     */
    String hashSenha(String senhaPlana);

    /**
     * Verifica se a senha corresponde ao hash
     */
    boolean verificarSenha(String senhaPlana, String hash);
}
