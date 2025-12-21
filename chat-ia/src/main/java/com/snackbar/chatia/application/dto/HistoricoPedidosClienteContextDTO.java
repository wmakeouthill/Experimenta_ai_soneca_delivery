package com.snackbar.chatia.application.dto;

import java.math.BigDecimal;
import java.util.List;

/**
 * DTO com contexto do histórico de pedidos do cliente para a IA.
 */
public record HistoricoPedidosClienteContextDTO(
    String clienteId,
    String nomeCliente,
    int totalPedidos,
    BigDecimal valorTotalGasto,
    List<ProdutoFavoritoDTO> produtosFavoritos,
    List<PedidoRecenteDTO> pedidosRecentes
) {
    
    /**
     * Produto favorito do cliente (mais pedido).
     */
    public record ProdutoFavoritoDTO(
        String produtoId,
        String nomeProduto,
        int vezesComprado,
        BigDecimal precoAtual
    ) {}
    
    /**
     * Pedido recente do cliente (resumo).
     */
    public record PedidoRecenteDTO(
        String pedidoId,
        String dataPedido,
        String status,
        BigDecimal valorTotal,
        List<String> nomesProdutos
    ) {}
    
    /**
     * Gera uma descrição textual do histórico para o system prompt da IA.
     */
    public String gerarDescricaoParaIA() {
        if (clienteId == null || clienteId.isBlank()) {
            return "Cliente não identificado (novo cliente ou visitante).";
        }
        
        StringBuilder sb = new StringBuilder();
        sb.append("=== PERFIL DO CLIENTE ===\n");
        
        if (nomeCliente != null && !nomeCliente.isBlank()) {
            sb.append("Nome: ").append(nomeCliente).append("\n");
        }
        
        sb.append("Total de pedidos: ").append(totalPedidos).append("\n");
        
        if (valorTotalGasto != null && valorTotalGasto.compareTo(BigDecimal.ZERO) > 0) {
            sb.append("Valor total gasto: R$ ").append(String.format("%.2f", valorTotalGasto)).append("\n");
        }
        
        if (produtosFavoritos != null && !produtosFavoritos.isEmpty()) {
            sb.append("\n🌟 Produtos favoritos:\n");
            for (ProdutoFavoritoDTO fav : produtosFavoritos) {
                sb.append("  • ").append(fav.nomeProduto())
                  .append(" (pedido ").append(fav.vezesComprado()).append("x)\n");
            }
        }
        
        if (pedidosRecentes != null && !pedidosRecentes.isEmpty()) {
            sb.append("\n📋 Últimos pedidos:\n");
            for (PedidoRecenteDTO pedido : pedidosRecentes) {
                sb.append("  • ").append(pedido.dataPedido())
                  .append(" - R$ ").append(String.format("%.2f", pedido.valorTotal()))
                  .append(" (").append(String.join(", ", pedido.nomesProdutos())).append(")\n");
            }
        }
        
        return sb.toString();
    }
    
    /**
     * Cria um contexto vazio para visitantes.
     */
    public static HistoricoPedidosClienteContextDTO visitante() {
        return new HistoricoPedidosClienteContextDTO(
            null, null, 0, BigDecimal.ZERO, List.of(), List.of()
        );
    }
}
