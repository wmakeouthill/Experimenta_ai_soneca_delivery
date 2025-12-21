package com.sonecadelivery.orquestrador.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Filtro para configurar headers de segurança que permitem popups do Google
 * OAuth.
 * 
 * O Google OAuth usa popups e precisa de comunicação entre janelas via
 * postMessage.
 * O Cross-Origin-Opener-Policy (COOP) padrão do Spring Security pode bloquear
 * isso.
 * Este filtro configura COOP como "same-origin-allow-popups" para permitir
 * popups.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class SecurityHeadersFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        // Para endpoints de API, especialmente OAuth, permitir popups
        if (request.getRequestURI().startsWith("/api/")) {
            // Configurar COOP para permitir popups (necessário para Google OAuth)
            // "same-origin-allow-popups" permite que popups da mesma origem comuniquem
            response.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");

            // Configurar COEP (Cross-Origin-Embedder-Policy) como não restritivo
            // Isso permite que recursos cross-origin sejam carregados
            response.setHeader("Cross-Origin-Embedder-Policy", "unsafe-none");
        }

        filterChain.doFilter(request, response);
    }
}
