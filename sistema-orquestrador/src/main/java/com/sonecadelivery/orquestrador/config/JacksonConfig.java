package com.sonecadelivery.orquestrador.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.http.converter.json.Jackson2ObjectMapperBuilder;

/**
 * Configuração do Jackson para serialização JSON.
 * Garante suporte a LocalDateTime e outras classes do pacote java.time.
 */
@Configuration
public class JacksonConfig {

    @Bean
    @Primary
    public ObjectMapper objectMapper(Jackson2ObjectMapperBuilder builder) {
        ObjectMapper mapper = builder.build();
        // Registrar módulo JSR310 para suportar LocalDateTime, LocalDate, etc.
        mapper.registerModule(new JavaTimeModule());
        // Desabilitar escrita de datas como timestamps (escrever como ISO-8601 string)
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        return mapper;
    }
}

