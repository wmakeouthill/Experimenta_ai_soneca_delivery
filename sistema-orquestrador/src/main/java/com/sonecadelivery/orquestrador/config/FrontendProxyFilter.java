package com.sonecadelivery.orquestrador.config;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.FilterConfig;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.annotation.Order;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;
import java.net.InetAddress;
import java.net.URI;
import java.net.UnknownHostException;
import java.util.Enumeration;

/**
 * Filter que faz proxy reverso para o frontend Angular (ng serve) em modo desenvolvimento.
 * 
 * Em DEV:
 * - Intercepta requisições que não são /api/**
 * - Faz proxy para http://frontend-dev:4200
 * - Permite hot reload completo do Angular
 * 
 * Em PROD:
 * - Este filter não faz nada (retorna 404 se não houver recursos estáticos)
 * - Os recursos estáticos são servidos pelo WebMvcConfig do classpath
 */
@Component
@Order(1) // Executa antes de outros filters
public class FrontendProxyFilter implements Filter {

    private final Environment environment;
    private final RestTemplate restTemplate;
    private final String frontendUrl;

    public FrontendProxyFilter(Environment environment, 
                               RestTemplate restTemplate,
                               @Value("${frontend.proxy.url:http://frontend-dev:4200}") String frontendUrl) {
        this.environment = environment;
        this.restTemplate = restTemplate;
        this.frontendUrl = frontendUrl;
    }

    @Override
    public void doFilter(jakarta.servlet.ServletRequest request, 
                        jakarta.servlet.ServletResponse response, 
                        FilterChain chain) throws IOException, ServletException {
        
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;
        
        // Apenas em modo dev
        if (!environment.matchesProfiles("dev")) {
            chain.doFilter(request, response);
            return;
        }

        String path = httpRequest.getRequestURI();
        String method = httpRequest.getMethod();
        String connectionHeader = httpRequest.getHeader("Connection");
        String upgradeHeader = httpRequest.getHeader("Upgrade");
        
        // Detectar requisições WebSocket (upgrade para WebSocket)
        boolean isWebSocket = "Upgrade".equalsIgnoreCase(connectionHeader) && 
                             "websocket".equalsIgnoreCase(upgradeHeader);
        
        // Log para debug de caminhos especiais do Vite
        if (path.startsWith("/@vite") || path.startsWith("/@fs")) {
            System.out.println("🔍 [FrontendProxyFilter] Caminho especial do Vite detectado: " + path);
        }
        
        // WebSocket não pode ser feito via RestTemplate (apenas HTTP)
        // O Vite detecta automaticamente e faz fallback para conexão WebSocket direta na porta 4200
        // Isso é esperado e funciona perfeitamente - o HMR continua funcionando
        if (isWebSocket) {
            System.out.println("ℹ️ [FrontendProxyFilter] WebSocket detectado - Vite fará fallback automático para ws://localhost:4200 (HMR funcionará normalmente)");
            // Deixar passar - o Vite fará fallback automaticamente
            // Não fazer proxy, deixar o navegador conectar diretamente
            chain.doFilter(request, response);
            return;
        }

        // Ignorar requisições para /api/** - deixar passar para os controllers
        if (path.startsWith("/api/") || path.equals("/api")) {
            chain.doFilter(request, response);
            return;
        }

        // Ignorar requisições para /actuator/** - deixar passar para o Spring Boot Actuator
        if (path.startsWith("/actuator/")) {
            chain.doFilter(request, response);
            return;
        }

        // Ignorar requisições WebSocket (HMR do Angular)
        if (path.startsWith("/sockjs-node/") || path.contains("websocket")) {
            chain.doFilter(request, response);
            return;
        }
        
        // IMPORTANTE: Caminhos especiais do Vite (@vite, @fs) DEVEM passar pelo proxy!

        // Fazer proxy para o frontend Angular
        try {
            // Resolver IP do frontend-dev para evitar bloqueio do Vite
            // Vite bloqueia hostnames não permitidos, mas aceita IPs
            String targetUrl = resolveFrontendUrl(frontendUrl) + path;
            
            // Adicionar query string se houver
            String queryString = httpRequest.getQueryString();
            if (queryString != null && !queryString.isEmpty()) {
                targetUrl += "?" + queryString;
            }
            
            // Log para debug
            System.out.println("🔄 [FrontendProxyFilter] Proxy: " + method + " " + targetUrl);

            // Preparar headers para o proxy
            HttpHeaders headers = new HttpHeaders();
            Enumeration<String> headerNames = httpRequest.getHeaderNames();
            while (headerNames.hasMoreElements()) {
                String headerName = headerNames.nextElement();
                // Ignorar headers que não devem ser repassados
                // IMPORTANTE: Host deve ser substituído, não copiado!
                if (!headerName.equalsIgnoreCase("host") && 
                    !headerName.equalsIgnoreCase("connection") &&
                    !headerName.equalsIgnoreCase("content-length") &&
                    !headerName.equalsIgnoreCase("transfer-encoding") &&
                    !headerName.equalsIgnoreCase("accept-encoding")) {
                    Enumeration<String> headerValues = httpRequest.getHeaders(headerName);
                    while (headerValues.hasMoreElements()) {
                        headers.add(headerName, headerValues.nextElement());
                    }
                }
            }
            
            // CRÍTICO: Ajustar header Host - Vite (Angular 17+) bloqueia hosts não permitidos
            // Deve ser localhost:4200 para o Vite aceitar
            headers.set("Host", "localhost:4200");
            
            // Log do header Host para debug
            if (path.startsWith("/@vite") || path.startsWith("/@fs")) {
                System.out.println("🔍 [FrontendProxyFilter] Header Host definido: " + headers.getFirst("Host"));
            }
            // Adicionar headers para evitar bloqueios
            headers.set("X-Forwarded-Host", httpRequest.getHeader("Host"));
            headers.set("X-Forwarded-Proto", httpRequest.getScheme());
            // Remover referer para evitar problemas
            headers.remove("Referer");

            // Para requisições GET/HEAD, não há corpo
            // Para POST/PUT, o RestTemplate pode ler do request, mas vamos simplificar por enquanto
            org.springframework.http.HttpEntity<?> entity = new org.springframework.http.HttpEntity<>(headers);
            
            ResponseEntity<byte[]> responseEntity;
            try {
                responseEntity = restTemplate.exchange(
                    URI.create(targetUrl),
                    HttpMethod.valueOf(method),
                    entity,
                    byte[].class
                );
                System.out.println("✅ [FrontendProxyFilter] Resposta: " + responseEntity.getStatusCode() + " para " + path);
            } catch (org.springframework.web.client.HttpClientErrorException e) {
                // Log detalhado de erros HTTP
                System.err.println("❌ [FrontendProxyFilter] Erro HTTP: " + e.getStatusCode() + " - " + e.getStatusText());
                System.err.println("   URL: " + targetUrl);
                System.err.println("   Headers enviados: " + headers);
                System.err.println("   Resposta: " + e.getResponseBodyAsString());
                throw e;
            }

            // Copiar status code
            httpResponse.setStatus(responseEntity.getStatusCode().value());

            // Copiar headers da resposta
            responseEntity.getHeaders().forEach((key, values) -> {
                // Ignorar headers que não devem ser repassados
                if (!key.equalsIgnoreCase("transfer-encoding") &&
                    !key.equalsIgnoreCase("content-encoding")) {
                    values.forEach(value -> httpResponse.addHeader(key, value));
                }
            });

            // Escrever corpo da resposta
            if (responseEntity.getBody() != null) {
                httpResponse.getOutputStream().write(responseEntity.getBody());
            }

        } catch (Exception e) {
            // Log completo do erro para debug
            String errorDetails = e.getClass().getSimpleName() + ": " + e.getMessage();
            if (e.getCause() != null) {
                errorDetails += " (causa: " + e.getCause().getMessage() + ")";
            }
            System.err.println("❌ [FrontendProxyFilter] Erro ao fazer proxy para " + frontendUrl + path);
            System.err.println("   Tipo: " + e.getClass().getName());
            System.err.println("   Mensagem: " + e.getMessage());
            if (e.getCause() != null) {
                System.err.println("   Causa: " + e.getCause().getClass().getName() + " - " + e.getCause().getMessage());
            }
            e.printStackTrace();
            
            // Se o frontend não estiver disponível, retornar 503
            httpResponse.setStatus(HttpStatus.SERVICE_UNAVAILABLE.value());
            httpResponse.setContentType("application/json");
            String errorMessage = String.format(
                "{\"error\":\"Frontend não disponível\",\"message\":\"O frontend Angular não está rodando em %s. " +
                "Execute 'npm start' no container frontend-dev.\",\"status\":503,\"details\":\"%s\"}",
                frontendUrl, errorDetails.replace("\"", "\\\"").replace("\n", " ")
            );
            try {
                httpResponse.getWriter().write(errorMessage);
            } catch (IOException ioException) {
                System.err.println("❌ Erro ao escrever resposta de erro: " + ioException.getMessage());
            }
        }
    }

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
        if (environment.matchesProfiles("dev")) {
            System.out.println("✅ [DEV] FrontendProxyFilter ativado - fazendo proxy para: " + frontendUrl);
        }
    }

    @Override
    public void destroy() {
        // Nada a fazer
    }
    
    /**
     * Resolve o hostname do frontend para IP, evitando bloqueio do Vite.
     * Se a URL contém "frontend-dev", resolve para o IP do container.
     */
    private String resolveFrontendUrl(String url) {
        try {
            // Se a URL contém frontend-dev, resolver para IP
            if (url.contains("frontend-dev")) {
                InetAddress address = InetAddress.getByName("frontend-dev");
                String ip = address.getHostAddress();
                // Substituir frontend-dev pelo IP
                String resolvedUrl = url.replace("frontend-dev", ip);
                System.out.println("✅ [FrontendProxyFilter] Resolvido frontend-dev -> " + ip);
                return resolvedUrl;
            }
            return url;
        } catch (UnknownHostException e) {
            System.err.println("⚠️ [FrontendProxyFilter] Não foi possível resolver frontend-dev, usando URL original: " + e.getMessage());
            return url;
        }
    }
}

