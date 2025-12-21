package com.snackbar.pedidos.application.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ItemPedidoRequest {
    @NotBlank(message = "ID do produto é obrigatório")
    private String produtoId;

    @Min(value = 1, message = "Quantidade deve ser maior que zero")
    private int quantidade;

    private String observacoes;

    @Valid
    private List<ItemPedidoAdicionalRequest> adicionais;
}
