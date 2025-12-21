package com.snackbar.autenticacao.infrastructure.config;

import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Propriedades de configuração do JWT.
 * Mapeia as propriedades do application.yml para um objeto tipado.
 */
@Configuration
@ConfigurationProperties(prefix = "jwt")
@Getter
@Setter
public class JwtProperties {
    
    /**
     * Chave secreta para assinar e validar tokens JWT.
     * Deve ter no mínimo 32 caracteres (256 bits) para segurança adequada.
     * Conforme RFC 7518, Section 3.2, chaves HMAC-SHA devem ter >= 256 bits.
     */
    private String secret = "CHANGE_THIS_IN_PRODUCTION_USE_STRONG_SECRET_KEY_MIN_32_CHARS";
    
    /**
     * Tempo de expiração do token em segundos.
     * Padrão: 86400 segundos (24 horas).
     */
    private Long expiration = 86400L;
    
    /**
     * Valida a chave secreta após a inicialização.
     * Garante que a chave tenha no mínimo 32 caracteres (256 bits) conforme RFC 7518.
     * 
     * @throws IllegalArgumentException se a chave for muito curta ou inválida
     */
    @PostConstruct
    public void validarSecret() {
        if (secret == null || secret.isBlank()) {
            throw new IllegalArgumentException(
                "JWT secret não pode ser nulo ou vazio. Configure jwt.secret no application-secrets.yml"
            );
        }
        
        if (secret.length() < 32) {
            throw new IllegalArgumentException(
                String.format(
                    "JWT secret deve ter no mínimo 32 caracteres (256 bits) para segurança adequada. " +
                    "Chave atual tem %d caracteres. " +
                    "Gere uma chave segura usando: openssl rand -base64 32",
                    secret.length()
                )
            );
        }
        
        if (secret.equals("CHANGE_THIS_IN_PRODUCTION_USE_STRONG_SECRET_KEY_MIN_32_CHARS")) {
            throw new IllegalArgumentException(
                "JWT secret não pode usar o valor padrão. Configure uma chave secreta única no application-secrets.yml"
            );
        }
    }
}

