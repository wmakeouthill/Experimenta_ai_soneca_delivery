package com.sonecadelivery.autenticacao.infrastructure.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private static final String ROLE_ADMINISTRADOR = "ADMINISTRADOR";
    private static final String ROLE_OPERADOR = "OPERADOR";
    private static final String PRODUTOS_PATH_PATTERN = "/api/produtos/**";
    private static final String CATEGORIAS_PATH_PATTERN = "/api/categorias/**";
    private static final String PEDIDOS_PATH_PATTERN = "/api/pedidos/**";
    private static final String SESSOES_TRABALHO_PATH = "/api/sessoes-trabalho";
    private static final String SESSOES_TRABALHO_PATTERN = "/api/sessoes-trabalho/**";
    private static final String CONFIG_ANIMACAO_PATH = "/api/config-animacao";
    private static final String CONFIG_ANIMACAO_PATTERN = "/api/config-animacao/**";
    private static final String HTTP_METHOD_DELETE = "DELETE";
    private static final String MESAS_PATH = "/api/mesas";
    private static final String MESAS_PATTERN = "/api/mesas/**";
    private static final String PUBLIC_MESA_PATTERN = "/api/public/mesa/**";
    private static final String PUBLIC_CLIENTE_AUTH_PATTERN = "/api/publico/cliente/auth/**";
    private static final String CLIENTE_CONTA_PATTERN = "/api/cliente/conta/**";

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Recursos estáticos e frontend Angular (PÚBLICO - sem autenticação)
                        .requestMatchers("/", "/index.html", "/favicon.ico", "/*.js", "/*.css", "/*.ico", "/*.png",
                                "/*.jpg", "/*.svg", "/*.woff", "/*.woff2", "/*.ttf", "/*.eot")
                        .permitAll()
                        .requestMatchers("/assets/**", "/styles/**").permitAll()

                        // Rotas do Angular Router (SPA) - PÚBLICO para frontend routing
                        // Apenas rotas de auto-atendimento do cliente (QR Code) e login
                        // A autenticação do cliente é feita via header X-Cliente-Id após o login na
                        // tela
                        .requestMatchers("/pedido-mesa/**", "/mesa/**", "/login").permitAll()
                        // Rota de fallback para erros (tratada pelo SpaFallbackConfig)
                        .requestMatchers("/error").permitAll()

                        // Endpoints públicos (sem autenticação)
                        .requestMatchers("/api/auth/login").permitAll()
                        .requestMatchers("/api/status").permitAll()
                        .requestMatchers("/api/health").permitAll()
                        // Endpoints públicos de mesas (QR Code) - Permite pedidos de clientes
                        .requestMatchers(PUBLIC_MESA_PATTERN).permitAll()
                        // Endpoints públicos de autenticação de cliente (login, Google OAuth)
                        .requestMatchers(PUBLIC_CLIENTE_AUTH_PATTERN).permitAll()
                        // Endpoint público para proxy de imagens (fotos do Google)
                        .requestMatchers("/api/publico/cliente/imagem/**").permitAll()
                        // Endpoints de conta do cliente (favoritos, perfil, etc.) - usa header
                        // X-Cliente-Id
                        .requestMatchers(CLIENTE_CONTA_PATTERN).permitAll()

                        // Endpoints do Chat IA - Público para clientes no auto-atendimento
                        // Usa header X-Cliente-Id para identificação opcional do cliente
                        .requestMatchers("/api/chat-ia/**").permitAll()

                        // Endpoints de autenticação (exigem autenticação)
                        .requestMatchers("/api/auth/**").authenticated()

                        // Endpoints administrativos (exigem role ADMINISTRADOR)
                        .requestMatchers("/api/admin/**").hasRole(ROLE_ADMINISTRADOR)

                        // Endpoints de cardápio - Leitura para ADMINISTRADOR e OPERADOR, escrita apenas
                        // ADMINISTRADOR
                        .requestMatchers("GET", PRODUTOS_PATH_PATTERN)
                        .hasAnyRole(ROLE_ADMINISTRADOR, ROLE_OPERADOR)
                        .requestMatchers("POST", PRODUTOS_PATH_PATTERN)
                        .hasRole(ROLE_ADMINISTRADOR)
                        .requestMatchers("PUT", PRODUTOS_PATH_PATTERN)
                        .hasRole(ROLE_ADMINISTRADOR)
                        .requestMatchers(HTTP_METHOD_DELETE, PRODUTOS_PATH_PATTERN)
                        .hasRole(ROLE_ADMINISTRADOR)
                        .requestMatchers("GET", CATEGORIAS_PATH_PATTERN)
                        .hasAnyRole(ROLE_ADMINISTRADOR, ROLE_OPERADOR)
                        .requestMatchers("POST", CATEGORIAS_PATH_PATTERN)
                        .hasRole(ROLE_ADMINISTRADOR)
                        .requestMatchers("PUT", CATEGORIAS_PATH_PATTERN)
                        .hasRole(ROLE_ADMINISTRADOR)
                        .requestMatchers(HTTP_METHOD_DELETE, CATEGORIAS_PATH_PATTERN)
                        .hasRole(ROLE_ADMINISTRADOR)

                        // Endpoints de pedidos - ADMINISTRADOR e OPERADOR
                        .requestMatchers(PEDIDOS_PATH_PATTERN).hasAnyRole(ROLE_ADMINISTRADOR, ROLE_OPERADOR)

                        // Endpoints de lobby de pedidos - ADMINISTRADOR e OPERADOR
                        .requestMatchers("/api/lobby-pedidos", "/api/lobby-pedidos/**")
                        .hasAnyRole(ROLE_ADMINISTRADOR, ROLE_OPERADOR)

                        // Endpoints de sessões de trabalho - Leitura para ADMINISTRADOR e OPERADOR,
                        // escrita apenas ADMINISTRADOR
                        .requestMatchers("GET", SESSOES_TRABALHO_PATH, SESSOES_TRABALHO_PATTERN)
                        .hasAnyRole(ROLE_ADMINISTRADOR, ROLE_OPERADOR)
                        .requestMatchers("POST", SESSOES_TRABALHO_PATH, SESSOES_TRABALHO_PATTERN)
                        .hasRole(ROLE_ADMINISTRADOR)
                        .requestMatchers("PUT", SESSOES_TRABALHO_PATH, SESSOES_TRABALHO_PATTERN)
                        .hasRole(ROLE_ADMINISTRADOR)
                        .requestMatchers(HTTP_METHOD_DELETE, SESSOES_TRABALHO_PATH, SESSOES_TRABALHO_PATTERN)
                        .hasRole(ROLE_ADMINISTRADOR)

                        // Endpoints de histórico de sessões - APENAS ADMINISTRADOR
                        .requestMatchers("/api/historico-sessoes", "/api/historico-sessoes/**")
                        .hasRole(ROLE_ADMINISTRADOR)

                        // Endpoints de relatórios - APENAS ADMINISTRADOR
                        .requestMatchers("/api/relatorios", "/api/relatorios/**").hasRole(ROLE_ADMINISTRADOR)
                        .requestMatchers("/api/relatorio-financeiro", "/api/relatorio-financeiro/**")
                        .hasRole(ROLE_ADMINISTRADOR)

                        // Endpoints de gestão de caixa - APENAS ADMINISTRADOR
                        .requestMatchers("/api/caixa", "/api/caixa/**")
                        .hasRole(ROLE_ADMINISTRADOR)

                        // Endpoints de mesas - Leitura para ADMINISTRADOR e OPERADOR, escrita apenas
                        // ADMINISTRADOR
                        .requestMatchers("GET", MESAS_PATH, MESAS_PATTERN)
                        .hasAnyRole(ROLE_ADMINISTRADOR, ROLE_OPERADOR)
                        .requestMatchers("POST", MESAS_PATH, MESAS_PATTERN)
                        .hasRole(ROLE_ADMINISTRADOR)
                        .requestMatchers("PUT", MESAS_PATH, MESAS_PATTERN)
                        .hasRole(ROLE_ADMINISTRADOR)
                        .requestMatchers(HTTP_METHOD_DELETE, MESAS_PATH, MESAS_PATTERN)
                        .hasRole(ROLE_ADMINISTRADOR)

                        // Endpoints de clientes - ADMINISTRADOR e OPERADOR (necessário para criar
                        // pedidos)
                        .requestMatchers("/api/clientes", "/api/clientes/**")
                        .hasAnyRole(ROLE_ADMINISTRADOR, ROLE_OPERADOR)

                        // Endpoints de configuração de animação - Leitura para ADMINISTRADOR e
                        // OPERADOR, escrita apenas ADMINISTRADOR
                        .requestMatchers("GET", CONFIG_ANIMACAO_PATH, CONFIG_ANIMACAO_PATTERN)
                        .hasAnyRole(ROLE_ADMINISTRADOR, ROLE_OPERADOR)
                        .requestMatchers("POST", CONFIG_ANIMACAO_PATH, CONFIG_ANIMACAO_PATTERN)
                        .hasRole(ROLE_ADMINISTRADOR)
                        .requestMatchers("PUT", CONFIG_ANIMACAO_PATH, CONFIG_ANIMACAO_PATTERN)
                        .hasRole(ROLE_ADMINISTRADOR)
                        .requestMatchers(HTTP_METHOD_DELETE, CONFIG_ANIMACAO_PATH, CONFIG_ANIMACAO_PATTERN)
                        .hasRole(ROLE_ADMINISTRADOR)

                        // Endpoints de auto atendimento (totem) - ADMINISTRADOR e OPERADOR
                        .requestMatchers("/api/autoatendimento/**")
                        .hasAnyRole(ROLE_ADMINISTRADOR, ROLE_OPERADOR)

                        // Endpoints de impressão - Configuração apenas ADMINISTRADOR, impressão
                        // ADMINISTRADOR e OPERADOR
                        .requestMatchers("GET", "/api/impressao/configuracao")
                        .hasAnyRole(ROLE_ADMINISTRADOR, ROLE_OPERADOR)
                        .requestMatchers("POST", "/api/impressao/configuracao")
                        .hasRole(ROLE_ADMINISTRADOR)
                        .requestMatchers("POST", "/api/impressao/cupom-fiscal")
                        .hasAnyRole(ROLE_ADMINISTRADOR, ROLE_OPERADOR)
                        .requestMatchers("POST", "/api/impressao/cupom-fiscal/formatar")
                        .hasAnyRole(ROLE_ADMINISTRADOR, ROLE_OPERADOR)

                        // Qualquer outro endpoint exige autenticação por padrão
                        .anyRequest().authenticated())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("*"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", HTTP_METHOD_DELETE, "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setExposedHeaders(List.of("Authorization"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
