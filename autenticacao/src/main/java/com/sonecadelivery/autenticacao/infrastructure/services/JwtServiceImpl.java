package com.sonecadelivery.autenticacao.infrastructure.services;

import com.sonecadelivery.autenticacao.domain.entities.Usuario;
import com.sonecadelivery.autenticacao.domain.services.JwtService;
import com.sonecadelivery.autenticacao.infrastructure.config.JwtProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;

@Service
@RequiredArgsConstructor
public class JwtServiceImpl implements JwtService {

    private final JwtProperties jwtProperties;

    @Override
    public String gerarToken(Usuario usuario) {
        Instant agora = Instant.now();
        Instant expiracao = agora.plus(jwtProperties.getExpiration(), ChronoUnit.SECONDS);

        return Jwts.builder()
                .subject(usuario.getEmail().getValor())
                .claim("id", usuario.getId())
                .claim("nome", usuario.getNome())
                .claim("role", usuario.getRole().getAuthority())
                .issuedAt(Date.from(agora))
                .expiration(Date.from(expiracao))
                .signWith(getSecretKey())
                .compact();
    }

    @Override
    public String extrairEmail(String token) {
        return extrairClaims(token).getSubject();
    }

    @Override
    public String extrairId(String token) {
        Claims claims = extrairClaims(token);
        return claims.get("id", String.class);
    }

    @Override
    public boolean validarToken(String token) {
        try {
            Claims claims = extrairClaims(token);
            return !claims.getExpiration().before(new Date());
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    public String extrairSubject(String token) {
        return extrairClaims(token).getSubject();
    }

    @Override
    public String extrairRole(String token) {
        Claims claims = extrairClaims(token);
        return claims.get("role", String.class);
    }

    public Claims extrairClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSecretKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private SecretKey getSecretKey() {
        byte[] keyBytes = jwtProperties.getSecret().getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
