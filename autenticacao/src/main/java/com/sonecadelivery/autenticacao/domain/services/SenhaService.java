package com.sonecadelivery.autenticacao.domain.services;

import com.sonecadelivery.autenticacao.domain.valueobjects.Senha;

public interface SenhaService {
    String gerarHash(String senhaPlana);
    boolean verificarSenha(String senhaPlana, String hash);
    Senha criarSenhaComHash(String senhaPlana);
}

