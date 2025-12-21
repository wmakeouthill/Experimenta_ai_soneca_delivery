package com.sonecadelivery.orquestrador.config;

import com.sonecadelivery.chatia.application.dto.HistoricoPedidosClienteContextDTO;
import com.sonecadelivery.chatia.application.dto.HistoricoPedidosClienteContextDTO.PedidoRecenteDTO;
import com.sonecadelivery.chatia.application.dto.HistoricoPedidosClienteContextDTO.ProdutoFavoritoDTO;
import com.sonecadelivery.chatia.application.port.out.PedidosClienteContextPort;
import com.sonecadelivery.pedidos.application.dto.HistoricoPedidoClienteDTO;
import com.sonecadelivery.pedidos.application.dto.HistoricoPedidosResponseDTO;
import com.sonecadelivery.pedidos.application.dto.ProdutoPopularDTO;
import com.sonecadelivery.pedidos.application.usecases.BuscarHistoricoPedidosClienteUseCase;
import com.sonecadelivery.pedidos.application.usecases.BuscarProdutosPopularesUseCase;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Adapter que fornece contexto de pedidos do cliente para o Chat IA.
 * Conecta o módulo chat-ia com gestao-pedidos.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PedidosClienteContextAdapter implements PedidosClienteContextPort {

    private static final int LIMITE_PEDIDOS_RECENTES = 5;
    private static final int LIMITE_PRODUTOS_FAVORITOS = 5;
    private static final DateTimeFormatter FORMATO_DATA = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private final BuscarHistoricoPedidosClienteUseCase buscarHistoricoUseCase;
    private final BuscarProdutosPopularesUseCase buscarProdutosPopularesUseCase;

    @Override
    public HistoricoPedidosClienteContextDTO buscarHistoricoPedidosCliente(String clienteId) {
        if (clienteId == null || clienteId.isBlank()) {
            log.debug("Cliente não identificado, retornando contexto de visitante");
            return HistoricoPedidosClienteContextDTO.visitante();
        }

        log.debug("Buscando histórico de pedidos para cliente: {}", clienteId);

        try {
            // Busca últimos pedidos
            HistoricoPedidosResponseDTO historico = buscarHistoricoUseCase.executar(
                    clienteId, 0, LIMITE_PEDIDOS_RECENTES);

            // Busca produtos favoritos do cliente
            List<ProdutoPopularDTO> favoritos = buscarProdutosPopularesUseCase
                    .buscarMaisPedidosPorCliente(clienteId, LIMITE_PRODUTOS_FAVORITOS);

            // Converte para DTOs do contexto
            List<PedidoRecenteDTO> pedidosRecentes = historico.getPedidos().stream()
                    .map(this::toPedidoRecente)
                    .toList();

            List<ProdutoFavoritoDTO> produtosFavoritos = favoritos.stream()
                    .map(this::toProdutoFavorito)
                    .toList();

            // Calcula valor total gasto
            BigDecimal valorTotalGasto = historico.getPedidos().stream()
                    .map(HistoricoPedidoClienteDTO::getValorTotal)
                    .filter(v -> v != null)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            log.info("Contexto de pedidos carregado para cliente {}: {} pedidos, {} favoritos",
                    clienteId, historico.getTotalPedidos(), favoritos.size());

            return new HistoricoPedidosClienteContextDTO(
                    clienteId,
                    null, // nome seria obtido de outro módulo se necessário
                    (int) historico.getTotalPedidos(),
                    valorTotalGasto,
                    produtosFavoritos,
                    pedidosRecentes);

        } catch (Exception e) {
            log.error("Erro ao buscar histórico de pedidos para cliente: {}", clienteId, e);
            return HistoricoPedidosClienteContextDTO.visitante();
        }
    }

    @Override
    public HistoricoPedidosClienteContextDTO buscarProdutosFavoritosCliente(String clienteId, int limite) {
        if (clienteId == null || clienteId.isBlank()) {
            return HistoricoPedidosClienteContextDTO.visitante();
        }

        try {
            List<ProdutoPopularDTO> favoritos = buscarProdutosPopularesUseCase
                    .buscarMaisPedidosPorCliente(clienteId, limite);

            List<ProdutoFavoritoDTO> produtosFavoritos = favoritos.stream()
                    .map(this::toProdutoFavorito)
                    .toList();

            return new HistoricoPedidosClienteContextDTO(
                    clienteId,
                    null,
                    0, // não temos total neste método
                    BigDecimal.ZERO,
                    produtosFavoritos,
                    List.of());

        } catch (Exception e) {
            log.error("Erro ao buscar favoritos para cliente: {}", clienteId, e);
            return HistoricoPedidosClienteContextDTO.visitante();
        }
    }

    private PedidoRecenteDTO toPedidoRecente(HistoricoPedidoClienteDTO pedido) {
        List<String> nomesProdutos = pedido.getItens().stream()
                .map(HistoricoPedidoClienteDTO.ItemHistoricoDTO::getNomeProduto)
                .limit(3) // Limita para não sobrecarregar o contexto
                .toList();

        String dataFormatada = pedido.getDataHoraPedido() != null
                ? pedido.getDataHoraPedido().format(FORMATO_DATA)
                : "Data desconhecida";

        return new PedidoRecenteDTO(
                pedido.getId(),
                dataFormatada,
                pedido.getStatusDescricao(),
                pedido.getValorTotal() != null ? pedido.getValorTotal() : BigDecimal.ZERO,
                nomesProdutos);
    }

    private ProdutoFavoritoDTO toProdutoFavorito(ProdutoPopularDTO produto) {
        return new ProdutoFavoritoDTO(
                produto.id(),
                produto.nome(),
                produto.quantidadeVendida() != null ? produto.quantidadeVendida().intValue() : 0,
                produto.preco());
    }
}
