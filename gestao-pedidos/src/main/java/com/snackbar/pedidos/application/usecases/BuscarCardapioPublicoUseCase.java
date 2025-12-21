package com.snackbar.pedidos.application.usecases;

import com.snackbar.pedidos.application.dto.CardapioPublicoDTO;
import com.snackbar.pedidos.application.ports.CardapioGatewayPort;
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
