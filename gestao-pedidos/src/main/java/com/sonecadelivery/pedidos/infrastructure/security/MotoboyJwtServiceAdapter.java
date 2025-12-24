package com.sonecadelivery.pedidos.infrastructure.security;

import com.sonecadelivery.pedidos.application.ports.MotoboyJwtServicePort;
import com.sonecadelivery.pedidos.domain.entities.Motoboy;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
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

        return Jwts.builder()
                .claims(claims)
                .subject(motoboy.getId())
                .issuedAt(now)
                .expiration(expirationDate)
                .signWith(getSigningKey())
                .compact();
    }

    @Override
    public String extrairMotoboyId(String token) {
        return extrairClaims(token).getSubject();
    }

    @Override
    public boolean validarToken(String token) {
        try {
            Claims claims = extrairClaims(token);
            Date expiration = claims.getExpiration();
            return expiration.after(new Date());
        } catch (Exception e) {
            return false;
        }
    }

    private Claims extrairClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}

