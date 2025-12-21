package com.snackbar.autenticacao.domain.services;

import com.snackbar.autenticacao.domain.valueobjects.Senha;

public interface SenhaService {
    String gerarHash(String senhaPlana);
    boolean verificarSenha(String senhaPlana, String hash);
    Senha criarSenhaComHash(String senhaPlana);
}

