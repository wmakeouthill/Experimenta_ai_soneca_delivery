package com.sonecadelivery.pedidos.application.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ItemPedidoAdicionalRequest {
    @NotBlank(message = "ID do adicional é obrigatório")
    private String adicionalId;

    @Min(value = 1, message = "Quantidade do adicional deve ser maior que zero")
    private int quantidade;
}
