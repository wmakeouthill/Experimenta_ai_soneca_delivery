package com.snackbar.pedidos.application.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Request para criação de pedido via auto atendimento (totem).
 * Requer autenticação de operador.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CriarPedidoAutoAtendimentoRequest {

    /**
     * Nome do cliente (opcional).
     * Usado para chamar o cliente quando o pedido estiver pronto.
     */
    @Size(max = 50, message = "Nome do cliente deve ter no máximo 50 caracteres")
    private String nomeCliente;

    /**
     * Observação geral do pedido (opcional).
     */
    @Size(max = 500, message = "Observação deve ter no máximo 500 caracteres")
    private String observacao;

    @NotEmpty(message = "Pedido deve ter pelo menos um item")
    @Valid
    private List<ItemPedidoRequest> itens;

    @NotEmpty(message = "Pedido deve ter pelo menos um meio de pagamento")
    @Valid
    private List<MeioPagamentoRequest> meiosPagamento;
}
