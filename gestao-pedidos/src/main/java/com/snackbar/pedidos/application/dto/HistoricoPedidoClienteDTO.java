package com.snackbar.pedidos.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO para histórico de pedido do cliente.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HistoricoPedidoClienteDTO {

    private String id;
    private Integer numeroPedido;
    private String status;
    private String statusDescricao;
    private LocalDateTime dataHoraPedido;
    private BigDecimal valorTotal;
    private Integer numeroMesa;
    private List<ItemHistoricoDTO> itens;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ItemHistoricoDTO {
        private String produtoId;
        private String nomeProduto;
        private Integer quantidade;
        private BigDecimal precoUnitario;
        private BigDecimal subtotal;
        private List<AdicionalHistoricoDTO> adicionais;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AdicionalHistoricoDTO {
        private String adicionalId;
        private String nome;
        private Integer quantidade;
        private BigDecimal precoUnitario;
        private BigDecimal subtotal;
    }
}
