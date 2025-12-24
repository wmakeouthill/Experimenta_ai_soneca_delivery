package com.sonecadelivery.pedidos.application.dto;

import lombok.Data;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;

/**
 * DTO de requisição para atualizar localização do motoboy.
 * Validações Bean Validation garantem dados válidos.
 */
@Data
public class AtualizarLocalizacaoRequest {
    
    @NotNull(message = "Pedido ID é obrigatório")
    private String pedidoId;
    
    @NotNull(message = "Latitude é obrigatória")
    @Min(value = -90, message = "Latitude deve estar entre -90 e 90")
    @Max(value = 90, message = "Latitude deve estar entre -90 e 90")
    private Double latitude;
    
    @NotNull(message = "Longitude é obrigatória")
    @Min(value = -180, message = "Longitude deve estar entre -180 e 180")
    @Max(value = 180, message = "Longitude deve estar entre -180 e 180")
    private Double longitude;
    
    @Min(value = 0, message = "Heading deve estar entre 0 e 360")
    @Max(value = 360, message = "Heading deve estar entre 0 e 360")
    private Double heading; // Opcional
    
    @Min(value = 0, message = "Velocidade não pode ser negativa")
    private Double velocidade; // Opcional, em km/h
}

