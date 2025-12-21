package com.snackbar.clientes.infrastructure.security;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.snackbar.clientes.application.ports.GoogleAuthServicePort;
import com.snackbar.clientes.application.ports.GoogleUserInfo;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
@Slf4j
public class GoogleAuthServiceAdapter implements GoogleAuthServicePort {

    @Value("${google.client-id:}")
    private String clientId;

    private GoogleIdTokenVerifier getVerifier() {
        if (clientId == null || clientId.isEmpty()) {
            log.error("Google Client ID não configurado! Verifique a variável de ambiente GOOGLE_CLIENT_ID");
            throw new IllegalStateException("Google Client ID não configurado");
        }
        log.debug("Usando Google Client ID: {}", clientId.substring(0, Math.min(20, clientId.length())) + "...");
        return new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), GsonFactory.getDefaultInstance())
                .setAudience(Collections.singletonList(clientId))
                .build();
    }

    @Override
    public GoogleUserInfo validarTokenGoogle(String googleToken) {
        try {
            log.info("Validando token Google...");
            GoogleIdToken idToken = getVerifier().verify(googleToken);

            if (idToken == null) {
                log.error("Token do Google inválido - verify() retornou null");
                throw new IllegalArgumentException("Token do Google inválido");
            }

            GoogleIdToken.Payload payload = idToken.getPayload();

            String googleId = payload.getSubject();
            String email = payload.getEmail();
            String nome = (String) payload.get("name");
            String fotoUrl = (String) payload.get("picture");
            boolean emailVerificado = Boolean.TRUE.equals(payload.getEmailVerified());

            log.info("Token Google validado com sucesso para: {}", email);
            return new GoogleUserInfo(googleId, email, nome, fotoUrl, emailVerificado);

        } catch (IllegalStateException e) {
            throw e; // Repassa erro de configuração
        } catch (Exception e) {
            log.error("Erro ao validar token do Google: {}", e.getMessage(), e);
            throw new IllegalArgumentException("Erro ao validar token do Google: " + e.getMessage(), e);
        }
    }
}
