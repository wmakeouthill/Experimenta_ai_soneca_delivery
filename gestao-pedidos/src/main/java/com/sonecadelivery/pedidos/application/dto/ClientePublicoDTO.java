package com.sonecadelivery.pedidos.application.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO público para representar um cliente.
 * Usado na API pública de pedidos por mesa.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClientePublicoDTO {
    private String id;
    private String nome;
    private String telefone;
    private Double latitude; // Latitude do endereço de entrega
    private Double longitude; // Longitude do endereço de entrega
}
