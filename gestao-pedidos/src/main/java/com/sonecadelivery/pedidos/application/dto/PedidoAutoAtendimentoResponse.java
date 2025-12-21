package com.sonecadelivery.pedidos.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Response para pedido criado via auto atendimento (totem).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PedidoAutoAtendimentoResponse {
    private String id;
    private String numeroPedido;
    private String nomeCliente;
    private String status;
    private BigDecimal valorTotal;
    private LocalDateTime dataPedido;
}
