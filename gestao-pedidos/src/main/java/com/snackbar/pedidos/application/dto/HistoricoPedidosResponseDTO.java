package com.snackbar.pedidos.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO para resposta paginada de histórico de pedidos.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HistoricoPedidosResponseDTO {

    private List<HistoricoPedidoClienteDTO> pedidos;
    private int paginaAtual;
    private int totalPaginas;
    private long totalPedidos;
}
