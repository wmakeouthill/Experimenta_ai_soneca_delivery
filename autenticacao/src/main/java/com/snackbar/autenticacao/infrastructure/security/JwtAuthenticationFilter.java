package com.snackbar.autenticacao.infrastructure.security;

import com.snackbar.autenticacao.domain.services.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private static final String BEARER_PREFIX = "Bearer ";

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        String requestUri = request.getRequestURI();
        String token = extrairToken(request);

        // Log apenas para autoatendimento (debug)
        if (requestUri.contains("/autoatendimento")) {
            log.info("[JWT-FILTER] URI: {}, Token presente: {}", requestUri, token != null);
        }

        if (token != null && jwtService.validarToken(token)) {
            String email = jwtService.extrairEmail(token);
            String usuarioId = jwtService.extrairId(token);
            String role = extrairRole(token);

            if (requestUri.contains("/autoatendimento")) {
                log.info("[JWT-FILTER] Token válido - Email: {}, ID: {}, Role: {}", email, usuarioId, role);
            }

            if (role != null && !role.isBlank()) {
                // O Spring Security espera o prefixo "ROLE_" para hasRole/hasAnyRole
                String roleComPrefixo = role.startsWith("ROLE_") ? role : "ROLE_" + role;
                var authorities = Collections.singletonList(
                        new SimpleGrantedAuthority(roleComPrefixo));

                // Cria um objeto com email e ID para facilitar o acesso
                var userDetails = new JwtUserDetails(email, usuarioId);
                var authentication = new UsernamePasswordAuthenticationToken(
                        userDetails, null, authorities);

                SecurityContextHolder.getContext().setAuthentication(authentication);

                if (requestUri.contains("/autoatendimento")) {
                    log.info("[JWT-FILTER] Autenticação configurada - Authorities: {}", authorities);
                }
            }
        } else if (token != null && requestUri.contains("/autoatendimento")) {
            log.warn("[JWT-FILTER] Token inválido para: {}", requestUri);
        }

        filterChain.doFilter(request, response);
    }

    private String extrairToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith(BEARER_PREFIX)) {
            return bearerToken.substring(BEARER_PREFIX.length());
        }
        return null;
    }

    private String extrairRole(String token) {
        try {
            String role = jwtService.extrairRole(token);
            if (role == null || role.isBlank()) {
                return null;
            }
            return role;
        } catch (Exception e) {
            return null;
        }
    }
}
