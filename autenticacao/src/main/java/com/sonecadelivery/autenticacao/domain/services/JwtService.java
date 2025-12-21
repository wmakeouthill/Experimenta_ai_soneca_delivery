package com.sonecadelivery.autenticacao.domain.services;

import com.sonecadelivery.autenticacao.domain.entities.Usuario;

public interface JwtService {
    String gerarToken(Usuario usuario);

    String extrairEmail(String token);

    String extrairId(String token);

    boolean validarToken(String token);

    String extrairSubject(String token);

    String extrairRole(String token);
}
