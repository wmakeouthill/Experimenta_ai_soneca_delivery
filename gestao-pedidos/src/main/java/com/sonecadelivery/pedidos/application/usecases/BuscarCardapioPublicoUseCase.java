package com.sonecadelivery.pedidos.application.usecases;

import com.sonecadelivery.pedidos.application.dto.CardapioPublicoDTO;
import com.sonecadelivery.pedidos.application.ports.CardapioGatewayPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * Use case para buscar o cardápio público (categorias ativas e produtos
 * disponíveis).
 */
@Service
@RequiredArgsConstructor
public class BuscarCardapioPublicoUseCase {

    private final CardapioGatewayPort cardapioGateway;

    public CardapioPublicoDTO executar() {
        return cardapioGateway.buscarCardapioPublico();
    }
}
