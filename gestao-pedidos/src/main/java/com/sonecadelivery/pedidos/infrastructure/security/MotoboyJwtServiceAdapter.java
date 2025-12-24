package com.sonecadelivery.pedidos.infrastructure.security;

import com.sonecadelivery.pedidos.application.ports.MotoboyJwtServicePort;
import com.sonecadelivery.pedidos.domain.entities.Motoboy;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

/**
 * Adapter para serviço de JWT de Motoboy.
 */
@Service
@Slf4j
public class MotoboyJwtServiceAdapter implements MotoboyJwtServicePort {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration:86400000}") // 24 horas em milissegundos
    private long expiration;

    private SecretKey getSigningKey() {
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    @Override
    public String gerarToken(Motoboy motoboy) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("motoboyId", motoboy.getId());
        claims.put("nome", motoboy.getNome());
        claims.put("email", motoboy.getEmail());
        claims.put("tipo", "MOTOBOY");

        Date now = new Date();
        Date expirationDate = new Date(now.getTime() + expiration);

        String token = Jwts.builder()
                .claims(claims)
                .subject(motoboy.getId())
                .issuedAt(now)
                .expiration(expirationDate)
                .signWith(getSigningKey())
                .compact();
        
        log.debug("Token JWT gerado para motoboy. ID: {}, Token length: {}, Expiração: {}", 
                motoboy.getId(), token.length(), expirationDate);
        
        return token;
    }

    @Override
    public String extrairMotoboyId(String token) {
        return extrairClaims(token).getSubject();
    }

    @Override
    public boolean validarToken(String token) {
        try {
            if (token == null || token.isBlank()) {
                log.warn("Token JWT de motoboy é nulo ou vazio");
                return false;
            }
            
            Claims claims = extrairClaims(token);
            Date expiration = claims.getExpiration();
            Date now = new Date();
            
            boolean isValid = expiration.after(now);
            
            if (!isValid) {
                log.warn("Token JWT de motoboy expirado. Expiração: {}, Agora: {}", expiration, now);
            } else {
                log.debug("Token JWT de motoboy válido. MotoboyId: {}, Expiração: {}", 
                        claims.getSubject(), expiration);
            }
            
            return isValid;
        } catch (io.jsonwebtoken.security.SignatureException e) {
            log.warn("Assinatura inválida do token JWT de motoboy: {}", e.getMessage());
            return false;
        } catch (io.jsonwebtoken.ExpiredJwtException e) {
            log.warn("Token JWT de motoboy expirado: {}", e.getMessage());
            return false;
        } catch (io.jsonwebtoken.MalformedJwtException e) {
            log.warn("Token JWT de motoboy malformado: {}", e.getMessage());
            return false;
        } catch (Exception e) {
            log.error("Erro ao validar token JWT de motoboy: {}", e.getMessage(), e);
            return false;
        }
    }

    private Claims extrairClaims(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (Exception e) {
            log.error("Erro ao extrair claims do token JWT de motoboy: {}", e.getMessage());
            throw e;
        }
    }
}

