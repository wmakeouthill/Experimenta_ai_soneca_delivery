package com.snackbar.clientes.infrastructure.security;

import com.snackbar.clientes.application.ports.ClienteJwtServicePort;
import com.snackbar.clientes.domain.entities.Cliente;
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

@Service
public class ClienteJwtServiceAdapter implements ClienteJwtServicePort {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration:86400000}") // 24 horas em milissegundos
    private long expiration;

    private SecretKey getSigningKey() {
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    @Override
    public String gerarToken(Cliente cliente) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("clienteId", cliente.getId());
        claims.put("telefone", cliente.getTelefone());
        claims.put("nome", cliente.getNome());
        claims.put("tipo", "CLIENTE");

        Date now = new Date();
        Date expirationDate = new Date(now.getTime() + expiration);

        return Jwts.builder()
                .claims(claims)
                .subject(cliente.getId())
                .issuedAt(now)
                .expiration(expirationDate)
                .signWith(getSigningKey())
                .compact();
    }

    @Override
    public String extrairClienteId(String token) {
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

    @Override
    public String extrairTelefone(String token) {
        Claims claims = extrairClaims(token);
        return claims.get("telefone", String.class);
    }

    private Claims extrairClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
