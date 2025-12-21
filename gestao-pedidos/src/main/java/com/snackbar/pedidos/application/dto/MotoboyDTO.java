package com.snackbar.pedidos.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO para transferência de dados de Motoboy.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MotoboyDTO {
    private String id;
    private String nome;
    private String telefone;
    private String veiculo;
    private String placa;
    private boolean ativo;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
