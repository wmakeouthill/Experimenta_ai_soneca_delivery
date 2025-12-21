package com.snackbar.pedidos.application.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Request para registrar pagamento de um pedido.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegistrarPagamentoPedidoRequest {

    @NotNull(message = "Lista de meios de pagamento é obrigatória")
    @NotEmpty(message = "Deve haver pelo menos um meio de pagamento")
    @Valid
    private List<MeioPagamentoRequest> meiosPagamento;
}
