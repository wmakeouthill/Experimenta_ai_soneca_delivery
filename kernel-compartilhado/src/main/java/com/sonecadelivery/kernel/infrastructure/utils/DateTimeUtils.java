package com.sonecadelivery.kernel.infrastructure.utils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

/**
 * Utilitário para manipulação de datas e horários.
 * Garante uso consistente do fuso horário de Brasília/São Paulo (America/Sao_Paulo).
 * 
 * IMPORTANTE: Sempre use os métodos desta classe ao invés de LocalDateTime.now() ou LocalDate.now()
 * para garantir que todas as datas sejam salvas no fuso horário correto.
 */
public class DateTimeUtils {
    
    private static final ZoneId ZONE_ID_SAO_PAULO = ZoneId.of("America/Sao_Paulo");
    
    private DateTimeUtils() {
        // Classe utilitária - não deve ser instanciada
    }
    
    private static final DateTimeFormatter DATE_TIME_FORMATTER = 
        DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");
    
    private static final DateTimeFormatter DATE_FORMATTER = 
        DateTimeFormatter.ofPattern("dd/MM/yyyy");
    
    /**
     * Retorna a data/hora atual no fuso horário de Brasília/São Paulo.
     * Use este método ao invés de LocalDateTime.now() para garantir consistência.
     * 
     * @return LocalDateTime atual no timezone America/Sao_Paulo
     */
    public static LocalDateTime now() {
        return LocalDateTime.now(ZONE_ID_SAO_PAULO);
    }
    
    /**
     * Retorna a data atual no fuso horário de Brasília/São Paulo.
     * Use este método ao invés de LocalDate.now() para garantir consistência.
     * 
     * @return LocalDate atual no timezone America/Sao_Paulo
     */
    public static LocalDate today() {
        return LocalDate.now(ZONE_ID_SAO_PAULO);
    }
    
    /**
     * Formata LocalDateTime para string no formato dd/MM/yyyy HH:mm:ss.
     */
    public static String formatDateTime(LocalDateTime dateTime) {
        if (dateTime == null) {
            return "";
        }
        return dateTime.format(DATE_TIME_FORMATTER);
    }
    
    /**
     * Formata LocalDateTime para string no formato dd/MM/yyyy.
     */
    public static String formatDate(LocalDateTime dateTime) {
        if (dateTime == null) {
            return "";
        }
        return dateTime.format(DATE_FORMATTER);
    }
    
    /**
     * Converte um LocalDateTime para o timezone de São Paulo.
     * Útil quando você tem um LocalDateTime que precisa ser interpretado no timezone correto.
     * 
     * @param dateTime LocalDateTime a ser convertido
     * @return LocalDateTime no timezone de São Paulo
     */
    public static LocalDateTime toSaoPauloTime(LocalDateTime dateTime) {
        if (dateTime == null) {
            return null;
        }
        // Se o LocalDateTime já está no timezone correto (assumindo que foi criado com now()),
        // apenas retorna. Caso contrário, precisaria de mais contexto sobre o timezone original.
        // Por enquanto, assumimos que LocalDateTime já está no timezone correto.
        return dateTime;
    }
}

