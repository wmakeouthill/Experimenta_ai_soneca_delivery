package com.snackbar.orquestrador.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Configuração do Spring MVC para servir o frontend Angular na raiz.
 * 
 * O Spring Boot automaticamente serve arquivos estáticos de classpath:/static/
 * Esta configuração adiciona suporte para rotas do Angular Router (SPA):
 * - Raiz (/) retorna index.html
 * - Rotas do Angular (ex: /dashboard, /produtos) retornam index.html
 * - Rotas /api/** são ignoradas e tratadas pelos controllers REST
 */
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Override
    public void addViewControllers(@NonNull ViewControllerRegistry registry) {
        // Mapeia a raiz para index.html
        registry.addViewController("/").setViewName("forward:/index.html");
    }
}
