package com.snackbar.orquestrador.config;

import com.snackbar.cardapio.application.dto.CategoriaDTO;
import com.snackbar.cardapio.application.dto.ProdutoDTO;
import com.snackbar.cardapio.application.usecases.ListarCategoriasUseCase;
import com.snackbar.cardapio.application.usecases.ListarProdutosUseCase;
import com.snackbar.pedidos.application.dto.CardapioPublicoDTO;
import com.snackbar.pedidos.application.dto.CardapioPublicoDTO.CategoriaPublicaDTO;
import com.snackbar.pedidos.application.dto.CardapioPublicoDTO.ProdutoPublicoDTO;
import com.snackbar.pedidos.application.ports.CardapioGatewayPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class CardapioGatewayAdapter implements CardapioGatewayPort {

    private final ListarCategoriasUseCase listarCategoriasUseCase;
    private final ListarProdutosUseCase listarProdutosUseCase;

    @Override
    public CardapioPublicoDTO buscarCardapioPublico() {
        List<CategoriaPublicaDTO> categorias = listarCategoriasUseCase.executarAtivas().stream()
                .map(this::toCategoriaPublica)
                .toList();

        List<ProdutoPublicoDTO> produtos = listarProdutosUseCase.executarDisponiveis().stream()
                .map(this::toProdutoPublico)
                .toList();

        return new CardapioPublicoDTO(categorias, produtos);
    }

    private CategoriaPublicaDTO toCategoriaPublica(CategoriaDTO dto) {
        return new CategoriaPublicaDTO(
                dto.getId(),
                dto.getNome(),
                dto.getDescricao(),
                dto.isAtiva());
    }

    private ProdutoPublicoDTO toProdutoPublico(ProdutoDTO dto) {
        return new ProdutoPublicoDTO(
                dto.getId(),
                dto.getNome(),
                dto.getDescricao(),
                dto.getPreco().doubleValue(),
                dto.getCategoria(),
                dto.isDisponivel(),
                dto.getFoto());
    }
}
