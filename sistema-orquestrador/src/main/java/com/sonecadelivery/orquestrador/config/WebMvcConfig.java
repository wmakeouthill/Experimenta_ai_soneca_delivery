package com.sonecadelivery.orquestrador.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Configuração do Spring MVC para servir o frontend Angular na raiz.
 * 
 * Em desenvolvimento:
 * - Serve recursos estáticos diretamente do filesystem (frontend/dist/frontend/browser)
 * - Permite hot reload completo sem reiniciar o backend
 * 
 * Em produção:
 * - Serve recursos estáticos de classpath:/static/ (copiados pelo Maven)
 * 
 * Esta configuração adiciona suporte para rotas do Angular Router (SPA):
 * - Raiz (/) retorna index.html
 * - Rotas do Angular (ex: /dashboard, /produtos) retornam index.html
 * - Rotas /api/** são ignoradas e tratadas pelos controllers REST
 */
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    private final Environment environment;
    private final String projectBaseDir;

    public WebMvcConfig(Environment environment, 
                       @Value("${project.base.dir:#{null}}") String projectBaseDir) {
        this.environment = environment;
        // Se não configurado, tenta detectar automaticamente
        this.projectBaseDir = projectBaseDir != null ? projectBaseDir : 
            System.getProperty("user.dir", "/app");
    }

    @Override
    public void addResourceHandlers(@NonNull ResourceHandlerRegistry registry) {
        boolean isDev = environment.matchesProfiles("dev");
        
        if (isDev) {
            // ✅ MODO DESENVOLVIMENTO: FrontendProxyFilter faz proxy para ng serve (porta 4200)
            // Não configuramos resource handlers aqui em dev - o proxy cuida de tudo
            // Isso permite hot reload completo do Angular sem precisar buildar
            System.out.println("✅ [DEV] Frontend será servido via proxy para ng serve (porta 4200)");
        } else {
            // ✅ MODO PRODUÇÃO: Serve do classpath (arquivos copiados pelo Maven)
            registry.addResourceHandler("/**")
                .addResourceLocations("classpath:/static/")
                .setCachePeriod(3600); // Cache de 1 hora em produção
        }
    }

    @Override
    public void addViewControllers(@NonNull ViewControllerRegistry registry) {
        // Mapeia a raiz para index.html
        // O forward só funciona se o recurso existir, caso contrário será tratado pelo SpaFallbackConfig
        registry.addViewController("/").setViewName("forward:/index.html");
    }
}
