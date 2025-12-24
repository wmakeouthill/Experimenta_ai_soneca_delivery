package com.sonecadelivery.pedidos.domain.valueobjects;

import lombok.Value;
import java.time.LocalDateTime;

/**
 * Value Object imutável para localização de motoboy.
 * Segue padrão DDD - Value Object sem identidade.
 * 
 * Representa a localização atual de um motoboy durante uma entrega.
 * Validações no construtor garantem integridade dos dados.
 */
@Value
public class LocalizacaoMotoboy {
    String motoboyId;
    String pedidoId;
    double latitude;
    double longitude;
    Double heading; // Direção em graus (0-360), opcional
    Double velocidade; // Em km/h, opcional
    LocalDateTime timestamp;
    
    /**
     * Construtor com validações.
     * Garante que todos os dados obrigatórios estão presentes e válidos.
     */
    public LocalizacaoMotoboy(
            String motoboyId,
            String pedidoId,
            double latitude,
            double longitude,
            Double heading,
            Double velocidade,
            LocalDateTime timestamp) {
        
        // Validações obrigatórias
        if (motoboyId == null || motoboyId.isBlank()) {
            throw new IllegalArgumentException("Motoboy ID é obrigatório");
        }
        if (pedidoId == null || pedidoId.isBlank()) {
            throw new IllegalArgumentException("Pedido ID é obrigatório");
        }
        if (latitude < -90 || latitude > 90) {
            throw new IllegalArgumentException("Latitude inválida: " + latitude + ". Deve estar entre -90 e 90");
        }
        if (longitude < -180 || longitude > 180) {
            throw new IllegalArgumentException("Longitude inválida: " + longitude + ". Deve estar entre -180 e 180");
        }
        
        // Validações opcionais
        if (heading != null && (heading < 0 || heading >= 360)) {
            throw new IllegalArgumentException("Heading inválido: " + heading + ". Deve estar entre 0 e 360");
        }
        if (velocidade != null && velocidade < 0) {
            throw new IllegalArgumentException("Velocidade inválida: " + velocidade + ". Não pode ser negativa");
        }
        
        // Atribuições
        this.motoboyId = motoboyId;
        this.pedidoId = pedidoId;
        this.latitude = latitude;
        this.longitude = longitude;
        this.heading = heading;
        this.velocidade = velocidade;
        this.timestamp = timestamp != null ? timestamp : LocalDateTime.now();
    }
    
    /**
     * Verifica se a localização ainda é válida (não expirou).
     * Localizações expiram após 5 minutos sem atualização.
     * 
     * @return true se a localização é válida, false caso contrário
     */
    public boolean isValida() {
        return timestamp.isAfter(LocalDateTime.now().minusMinutes(5));
    }
    
    /**
     * Calcula a distância em quilômetros até outra localização usando fórmula de Haversine.
     * 
     * @param outra Localização de destino
     * @return Distância em quilômetros
     */
    public double calcularDistanciaKm(LocalizacaoMotoboy outra) {
        final int RAIO_TERRA_KM = 6371;
        
        double lat1Rad = Math.toRadians(this.latitude);
        double lat2Rad = Math.toRadians(outra.latitude);
        double deltaLatRad = Math.toRadians(outra.latitude - this.latitude);
        double deltaLngRad = Math.toRadians(outra.longitude - this.longitude);
        
        double a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2)
                + Math.cos(lat1Rad) * Math.cos(lat2Rad)
                * Math.sin(deltaLngRad / 2) * Math.sin(deltaLngRad / 2);
        
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        
        return RAIO_TERRA_KM * c;
    }
}

