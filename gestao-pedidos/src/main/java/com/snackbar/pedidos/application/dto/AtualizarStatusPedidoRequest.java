package com.snackbar.pedidos.application.dto;

import com.snackbar.pedidos.domain.entities.StatusPedido;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AtualizarStatusPedidoRequest {
    @NotNull(message = "Status é obrigatório")
    private StatusPedido status;
}

