package com.sonecadelivery.chatia.infrastructure.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;

import java.net.http.HttpClient;
import java.time.Duration;

/**
 * Configuração do módulo Chat IA.
 * Define beans para ObjectMapper e HttpClient seguindo as regras de DI.
 */
@Configuration
@ComponentScan(basePackages = "com.sonecadelivery.chatia")
public class ChatIAConfig {

    private static final int DEFAULT_TIMEOUT_SEGUNDOS = 60;

    /**
     * Bean do ObjectMapper configurado para o módulo Chat IA.
     * Reutiliza configuração padrão se já existir, senão cria uma nova.
     */
    @Bean(name = "chatIAObjectMapper")
    public ObjectMapper chatIAObjectMapper() {
        return new ObjectMapper()
                .registerModule(new JavaTimeModule())
                .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    }

    /**
     * Bean do HttpClient para chamadas à API da OpenAI.
     */
    @Bean(name = "chatIAHttpClient")
    public HttpClient chatIAHttpClient(
            @Value("${openai.timeout.seconds:" + DEFAULT_TIMEOUT_SEGUNDOS + "}") int timeoutSegundos) {
        return HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(timeoutSegundos))
                .build();
    }
}
