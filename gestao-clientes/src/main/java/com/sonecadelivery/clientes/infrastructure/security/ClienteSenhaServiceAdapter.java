package com.sonecadelivery.clientes.infrastructure.security;

import com.sonecadelivery.clientes.application.ports.ClienteSenhaServicePort;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class ClienteSenhaServiceAdapter implements ClienteSenhaServicePort {

    private final PasswordEncoder passwordEncoder;

    public ClienteSenhaServiceAdapter() {
        this.passwordEncoder = new BCryptPasswordEncoder();
    }

    @Override
    public String hashSenha(String senhaPlana) {
        return passwordEncoder.encode(senhaPlana);
    }

    @Override
    public boolean verificarSenha(String senhaPlana, String hash) {
        return passwordEncoder.matches(senhaPlana, hash);
    }
}
