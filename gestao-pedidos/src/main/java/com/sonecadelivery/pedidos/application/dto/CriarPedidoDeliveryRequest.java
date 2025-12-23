package com.sonecadelivery.pedidos.application.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * Request para criação de pedido de delivery/retirada.
 * Não requer mesa, pois é um pedido externo.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CriarPedidoDeliveryRequest {

    /**
     * ID do cliente (opcional - pode ser cliente não cadastrado)
     */
    private String clienteId;

    @NotBlank(message = "Nome do cliente é obrigatório")
    @Size(min = 2, max = 100, message = "Nome do cliente deve ter entre 2 e 100 caracteres")
    private String nomeCliente;

    @NotBlank(message = "Telefone do cliente é obrigatório")
    private String telefoneCliente;

    private String emailCliente;

    @NotEmpty(message = "Pedido deve ter pelo menos um item")
    @Valid
    private List<ItemPedidoRequest> itens;

    private String observacoes;

    /**
     * Meios de pagamento selecionados pelo cliente.
     */
    @Valid
    private List<MeioPagamentoRequest> meiosPagamento;

    /**
     * Tipo do pedido: DELIVERY ou RETIRADA.
     */
    @NotBlank(message = "Tipo do pedido é obrigatório")
    private String tipoPedido;

    /**
     * Endereço de entrega formatado.
     * Obrigatório quando tipoPedido = DELIVERY.
     */
    private String enderecoEntrega;

    /**
     * Campos de endereço detalhados
     */
    private String logradouro;
    private String numero;
    private String complemento;
    private String bairro;
    private String cidade;
    private String estado;
    private String cep;
    private String pontoReferencia;

    /**
     * Taxa de entrega (calculada ou informada)
     */
    private BigDecimal taxaEntrega;

    /**
     * Valor de desconto (cupom, promoção, etc.)
     */
    private BigDecimal valorDesconto;

    /**
     * Previsão de entrega informada pelo cliente.
     * Exemplo: "O mais rápido possível", "Entre 18h e 19h"
     */
    private String previsaoEntregaCliente;

    /**
     * Troco para (se pagamento em dinheiro)
     */
    private BigDecimal trocoPara;
}
