package com.snackbar.pedidos.application.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request para atualização de uma mesa.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AtualizarMesaRequest {

    @Min(value = 1, message = "Número da mesa deve ser maior que zero")
    private Integer numero;

    @Size(max = 100, message = "Nome da mesa não pode ter mais de 100 caracteres")
    private String nome;

    private Boolean ativa;
}
