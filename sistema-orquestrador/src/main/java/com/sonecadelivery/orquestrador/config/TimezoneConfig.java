package com.sonecadelivery.orquestrador.config;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;

import java.util.TimeZone;

/**
 * Configuração de timezone da aplicação.
 * Garante que o timezone padrão da JVM seja sempre America/Sao_Paulo (Brasília).
 * 
 * IMPORTANTE: Esta configuração é executada na inicialização da aplicação
 * para garantir que todas as operações de data/hora usem o fuso horário correto.
 */
@Configuration
@Slf4j
public class TimezoneConfig {

    private static final String TIMEZONE_SAO_PAULO = "America/Sao_Paulo";

    @PostConstruct
    public void configurarTimezone() {
        TimeZone.setDefault(TimeZone.getTimeZone(TIMEZONE_SAO_PAULO));
        log.info("✅ Timezone da aplicação configurado para: {}", TIMEZONE_SAO_PAULO);
        log.info("   Timezone atual da JVM: {}", TimeZone.getDefault().getID());
    }
}

