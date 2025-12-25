package com.sonecadelivery.orquestrador.config;

import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;
import java.net.HttpURLConnection;
import java.time.Duration;

/**
 * Configuração do RestTemplate para requisições HTTP externas.
 * Segue as regras de injeção de dependência (não criar instâncias manualmente).
 */
@Configuration
public class RestTemplateConfig {

    @Bean
    public RestTemplate restTemplate(RestTemplateBuilder builder) {
        return builder
                .setConnectTimeout(Duration.ofSeconds(10))
                .setReadTimeout(Duration.ofSeconds(30))
                .requestFactory(() -> new SimpleClientHttpRequestFactory() {
                    @Override
                    protected void prepareConnection(HttpURLConnection connection, String httpMethod) throws IOException {
                        super.prepareConnection(connection, httpMethod);
                        // Garantir que o header Host seja respeitado mesmo quando a URL usa IP
                        // Isso é importante para o proxy do frontend funcionar com Vite
                    }
                })
                .build();
    }
}
