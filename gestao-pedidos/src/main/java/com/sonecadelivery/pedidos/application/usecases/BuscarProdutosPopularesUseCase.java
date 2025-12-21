package com.sonecadelivery.pedidos.application.usecases;

import com.sonecadelivery.pedidos.application.dto.ProdutoPopularDTO;
import com.sonecadelivery.pedidos.application.ports.ProdutoPopularGatewayPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Use Case para buscar produtos populares (mais pedidos, mais favoritados e
 * mais bem avaliados).
 */
@Service
@RequiredArgsConstructor
public class BuscarProdutosPopularesUseCase {

    private final ProdutoPopularGatewayPort produtoPopularGateway;

    /**
     * Busca os produtos mais pedidos.
     * Ordenados pela quantidade de vezes que aparecem em pedidos.
     */
    public List<ProdutoPopularDTO> buscarMaisPedidos(int limite) {
        return produtoPopularGateway.buscarMaisPedidos(limite);
    }

    /**
     * Busca os produtos mais pedidos por um cliente específico.
     * Baseado no histórico de pedidos do cliente.
     */
    public List<ProdutoPopularDTO> buscarMaisPedidosPorCliente(String clienteId, int limite) {
        return produtoPopularGateway.buscarMaisPedidosPorCliente(clienteId, limite);
    }

    /**
     * Busca os produtos mais bem avaliados.
     * Ordenados pela média de avaliações (mínimo de 1 avaliação).
     */
    public List<ProdutoPopularDTO> buscarBemAvaliados(int limite) {
        return produtoPopularGateway.buscarBemAvaliados(limite);
    }

    /**
     * Busca os produtos mais favoritados.
     * Ordenados pela quantidade de clientes que favoritaram.
     */
    public List<ProdutoPopularDTO> buscarMaisFavoritados(int limite) {
        return produtoPopularGateway.buscarMaisFavoritados(limite);
    }
}
