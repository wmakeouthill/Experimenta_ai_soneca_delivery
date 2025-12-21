package com.sonecadelivery.pedidos.application.ports;

import com.sonecadelivery.cardapio.application.dto.AdicionalDTO;
import com.sonecadelivery.cardapio.application.dto.ProdutoDTO;

public interface CardapioServicePort {
    ProdutoDTO buscarProdutoPorId(String id);

    boolean produtoEstaDisponivel(String id);

    AdicionalDTO buscarAdicionalPorId(String id);

    boolean adicionalEstaDisponivel(String id);
}
