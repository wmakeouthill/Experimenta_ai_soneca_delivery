package com.snackbar.pedidos.application.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Request para criação de pedido via mesa (cliente).
 * Não requer autenticação, pois vem do QR Code.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CriarPedidoMesaRequest {

    @NotBlank(message = "Token da mesa é obrigatório")
    private String mesaToken;

    @NotBlank(message = "ID do cliente é obrigatório")
    private String clienteId;

    @NotBlank(message = "Nome do cliente é obrigatório")
    @Size(min = 2, max = 100, message = "Nome do cliente deve ter entre 2 e 100 caracteres")
    private String nomeCliente;

    @NotEmpty(message = "Pedido deve ter pelo menos um item")
    @Valid
    private List<ItemPedidoRequest> itens;

    private String observacoes;

    /**
     * Meios de pagamento selecionados pelo cliente.
     * Opcional - se não informado, o pagamento será registrado na entrega.
     */
    @Valid
    private List<MeioPagamentoRequest> meiosPagamento;

    // ========== Campos de Delivery ==========

    /**
     * Tipo do pedido: MESA, DELIVERY ou RETIRADA.
     * Se não informado, assume MESA.
     */
    private String tipoPedido;

    /**
     * Endereço de entrega para pedidos DELIVERY.
     * Obrigatório quando tipoPedido = DELIVERY.
     */
    private String enderecoEntrega;

    /**
     * Previsão de entrega informada pelo cliente.
     * Exemplo: "O mais rápido possível", "Entre 18h e 19h"
     */
    private String previsaoEntregaCliente;

    public String mesaToken() {
        return mesaToken;
    }
}
