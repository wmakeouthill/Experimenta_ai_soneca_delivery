package com.sonecadelivery.clientes.application.dto;

import com.sonecadelivery.clientes.domain.entities.ClienteFavorito;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClienteFavoritoDTO {

    private String id;
    private String clienteId;
    private String produtoId;
    private LocalDateTime createdAt;

    public static ClienteFavoritoDTO de(ClienteFavorito favorito) {
        return ClienteFavoritoDTO.builder()
                .id(favorito.getId())
                .clienteId(favorito.getClienteId())
                .produtoId(favorito.getProdutoId())
                .createdAt(favorito.getCreatedAt())
                .build();
    }
}
