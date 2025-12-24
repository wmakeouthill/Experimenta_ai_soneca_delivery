package com.sonecadelivery.pedidos.application.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * DTO de resposta para rastreamento de pedido.
 * Contém todas as informações necessárias para o cliente visualizar o rastreamento.
 */
@Data
@Builder
public class RastreamentoPedidoResponse {
    private String pedidoId;
    private String numeroPedido;
    private String statusPedido;
    
    // Motoboy
    private String motoboyId;
    private String motoboyNome;
    
    // Localização do motoboy (pode ser null se não houver)
    private LocalizacaoMotoboyDTO localizacaoMotoboy;
    
    // Destino (endereço de entrega)
    private Double latitudeDestino;
    private Double longitudeDestino;
    private String enderecoEntrega;
    
    // Metadados
    private boolean permiteRastreamento;
    private LocalDateTime ultimaAtualizacao;
    
    /**
     * DTO interno para localização do motoboy.
     */
    @Data
    @Builder
    public static class LocalizacaoMotoboyDTO {
        private Double latitude;
        private Double longitude;
        private Double heading;
        private Double velocidade;
        private LocalDateTime timestamp;
        private boolean valida; // Se não expirou (menos de 5 minutos)
    }
}

