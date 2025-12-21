package com.sonecadelivery.clientes.application.ports;

public interface GoogleAuthServicePort {

    /**
     * Valida o token do Google e retorna os dados do usuário
     * 
     * @param googleToken Token ID do Google
     * @return Informações do usuário Google
     * @throws IllegalArgumentException se o token for inválido
     */
    GoogleUserInfo validarTokenGoogle(String googleToken);
}
