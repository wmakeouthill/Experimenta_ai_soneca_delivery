package com.sonecadelivery.pedidos.application.dto;

import com.sonecadelivery.pedidos.domain.entities.Mesa;

import java.time.LocalDateTime;

/**
 * DTO de resposta para Mesa.
 */
public record MesaDTO(
        String id,
        int numero,
        String nome,
        String qrCodeToken,
        boolean ativa,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {

    /**
     * Converte uma entidade Mesa para DTO.
     */
    public static MesaDTO de(Mesa mesa) {
        return new MesaDTO(
                mesa.getId(),
                mesa.getNumero(),
                mesa.getNome(),
                mesa.getQrCodeTokenValor(),
                mesa.isAtiva(),
                mesa.getCreatedAt(),
                mesa.getUpdatedAt());
    }
}
