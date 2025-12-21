package com.sonecadelivery.clientes.application.dto;

import com.sonecadelivery.clientes.domain.entities.ClienteAvaliacao;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClienteAvaliacaoDTO {

    private String id;
    private String clienteId;
    private String produtoId;
    private String pedidoId;
    private Integer nota;
    private String comentario;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ClienteAvaliacaoDTO de(ClienteAvaliacao avaliacao) {
        return ClienteAvaliacaoDTO.builder()
                .id(avaliacao.getId())
                .clienteId(avaliacao.getClienteId())
                .produtoId(avaliacao.getProdutoId())
                .pedidoId(avaliacao.getPedidoId())
                .nota(avaliacao.getNota())
                .comentario(avaliacao.getComentario())
                .createdAt(avaliacao.getCreatedAt())
                .updatedAt(avaliacao.getUpdatedAt())
                .build();
    }
}
