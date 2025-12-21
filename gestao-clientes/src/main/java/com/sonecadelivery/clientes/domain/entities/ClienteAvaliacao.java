package com.sonecadelivery.clientes.domain.entities;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Builder
@AllArgsConstructor
public class ClienteAvaliacao {

    private final String id;
    private final String clienteId;
    private final String produtoId;
    private final String pedidoId;
    private Integer nota; // 1-5 estrelas
    private String comentario;
    private final LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ClienteAvaliacao criar(String clienteId, String produtoId, String pedidoId, Integer nota,
            String comentario) {
        validarNota(nota);
        LocalDateTime agora = LocalDateTime.now();
        return ClienteAvaliacao.builder()
                .id(UUID.randomUUID().toString())
                .clienteId(clienteId)
                .produtoId(produtoId)
                .pedidoId(pedidoId)
                .nota(nota)
                .comentario(comentario)
                .createdAt(agora)
                .updatedAt(agora)
                .build();
    }

    public static ClienteAvaliacao reconstruir(
            String id,
            String clienteId,
            String produtoId,
            String pedidoId,
            Integer nota,
            String comentario,
            LocalDateTime createdAt,
            LocalDateTime updatedAt) {
        return ClienteAvaliacao.builder()
                .id(id)
                .clienteId(clienteId)
                .produtoId(produtoId)
                .pedidoId(pedidoId)
                .nota(nota)
                .comentario(comentario)
                .createdAt(createdAt)
                .updatedAt(updatedAt)
                .build();
    }

    public void atualizarNota(Integer novaNota) {
        validarNota(novaNota);
        this.nota = novaNota;
        this.updatedAt = LocalDateTime.now();
    }

    public void atualizarComentario(String novoComentario) {
        this.comentario = novoComentario;
        this.updatedAt = LocalDateTime.now();
    }

    public void atualizar(Integer novaNota, String novoComentario) {
        if (novaNota != null) {
            validarNota(novaNota);
            this.nota = novaNota;
        }
        this.comentario = novoComentario;
        this.updatedAt = LocalDateTime.now();
    }

    private static void validarNota(Integer nota) {
        if (nota == null || nota < 1 || nota > 5) {
            throw new IllegalArgumentException("Nota deve ser entre 1 e 5");
        }
    }
}
