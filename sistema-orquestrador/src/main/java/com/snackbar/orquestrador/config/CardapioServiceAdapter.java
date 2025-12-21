package com.snackbar.orquestrador.config;

import com.snackbar.cardapio.application.dto.AdicionalDTO;
import com.snackbar.cardapio.application.dto.ProdutoDTO;
import com.snackbar.cardapio.application.usecases.BuscarAdicionalPorIdUseCase;
import com.snackbar.cardapio.application.usecases.BuscarProdutoPorIdUseCase;
import com.snackbar.pedidos.application.ports.CardapioServicePort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class CardapioServiceAdapter implements CardapioServicePort {

    private final BuscarProdutoPorIdUseCase buscarProdutoPorIdUseCase;
    private final BuscarAdicionalPorIdUseCase buscarAdicionalPorIdUseCase;

    @Override
    public ProdutoDTO buscarProdutoPorId(String id) {
        return buscarProdutoPorIdUseCase.executar(id);
    }

    @Override
    public boolean produtoEstaDisponivel(String id) {
        try {
            ProdutoDTO produto = buscarProdutoPorIdUseCase.executar(id);
            return produto.isDisponivel();
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    public AdicionalDTO buscarAdicionalPorId(String id) {
        return buscarAdicionalPorIdUseCase.executar(id);
    }

    @Override
    public boolean adicionalEstaDisponivel(String id) {
        try {
            AdicionalDTO adicional = buscarAdicionalPorIdUseCase.executar(id);
            return adicional.isDisponivel();
        } catch (Exception e) {
            return false;
        }
    }
}
