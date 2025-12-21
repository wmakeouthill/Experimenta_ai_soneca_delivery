package com.snackbar.orquestrador.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

@Configuration
public class CorsConfig {

    @Bean
    public CorsFilter corsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();

        config.setAllowCredentials(true);
        config.addAllowedOriginPattern("*");
        config.addAllowedHeader("*");
        config.addAllowedMethod("*");

        // Headers expostos para o frontend (incluindo headers customizados)
        config.addExposedHeader("Authorization");
        config.addExposedHeader("X-Cliente-Id");

        // Configurações para permitir popups do Google OAuth
        // Cross-Origin-Opener-Policy será definido como "same-origin-allow-popups"
        // ou não será definido para permitir comunicação entre janelas
        // Isso é feito via SecurityConfig ou WebMvcConfig

        source.registerCorsConfiguration("/api/**", config);

        return new CorsFilter(source);
    }
}
