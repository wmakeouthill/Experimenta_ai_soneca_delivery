package com.sonecadelivery.pedidos.application.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO para requisição de atribuição de motoboy a um pedido de delivery.
 * Segue o padrão de outros DTOs de request do módulo.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AtribuirMotoboyRequest {

    @NotBlank(message = "ID do motoboy é obrigatório")
    private String motoboyId;
}
