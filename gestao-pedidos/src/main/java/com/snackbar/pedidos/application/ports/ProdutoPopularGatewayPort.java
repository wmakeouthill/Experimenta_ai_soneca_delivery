package com.snackbar.pedidos.application.ports;

import com.snackbar.pedidos.application.dto.ProdutoPopularDTO;

import java.util.List;

/**
 * Port para buscar dados de produtos populares.
 * Combina dados de pedidos e avaliações.
 */
public interface ProdutoPopularGatewayPort {

    /**
     * Busca os produtos mais pedidos.
     * Ordenados pela quantidade de vezes que aparecem em pedidos.
     */
    List<ProdutoPopularDTO> buscarMaisPedidos(int limite);

    /**
     * Busca os produtos mais pedidos por um cliente específico.
     * Baseado no histórico de pedidos do cliente.
     */
    List<ProdutoPopularDTO> buscarMaisPedidosPorCliente(String clienteId, int limite);

    /**
     * Busca os produtos mais bem avaliados.
     * Ordenados pela média de avaliações (mínimo de 1 avaliação).
     */
    List<ProdutoPopularDTO> buscarBemAvaliados(int limite);

    /**
     * Busca os produtos mais favoritados.
     * Ordenados pela quantidade de clientes que favoritaram.
     */
    List<ProdutoPopularDTO> buscarMaisFavoritados(int limite);
}
