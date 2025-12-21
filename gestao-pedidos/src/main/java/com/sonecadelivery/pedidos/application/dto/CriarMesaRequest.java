package com.sonecadelivery.pedidos.application.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request para criação de uma nova mesa.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CriarMesaRequest {

    @Min(value = 1, message = "Número da mesa deve ser maior que zero")
    private int numero;

    @NotBlank(message = "Nome da mesa é obrigatório")
    @Size(max = 100, message = "Nome da mesa não pode ter mais de 100 caracteres")
    private String nome;
}
