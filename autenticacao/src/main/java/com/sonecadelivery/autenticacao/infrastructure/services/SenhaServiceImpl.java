package com.sonecadelivery.autenticacao.infrastructure.services;

import com.sonecadelivery.autenticacao.domain.services.SenhaService;
import com.sonecadelivery.autenticacao.domain.valueobjects.Senha;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class SenhaServiceImpl implements SenhaService {
    
    private final PasswordEncoder passwordEncoder;
    
    @Override
    public String gerarHash(String senhaPlana) {
        return passwordEncoder.encode(senhaPlana);
    }
    
    @Override
    public boolean verificarSenha(String senhaPlana, String hash) {
        return passwordEncoder.matches(senhaPlana, hash);
    }
    
    @Override
    public Senha criarSenhaComHash(String senhaPlana) {
        String hash = gerarHash(senhaPlana);
        return Senha.restaurarHash(hash);
    }
}

