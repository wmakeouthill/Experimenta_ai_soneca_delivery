package com.snackbar.pedidos.application.usecases;

import com.snackbar.pedidos.application.dto.ItemEstoqueDTO;
import com.snackbar.pedidos.application.ports.ItemEstoqueRepositoryPort;
import com.snackbar.pedidos.domain.entities.ItemEstoque;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

/**
 * Use case para listar itens de estoque com paginação.
 */
@Service
@RequiredArgsConstructor
public class ListarItensEstoqueUseCase {
    
    private final ItemEstoqueRepositoryPort repository;
    
    /**
     * Lista todos os itens de estoque paginados.
     */
    public Page<ItemEstoqueDTO> executar(Pageable pageable) {
        return repository.listarPaginado(pageable)
                .map(ItemEstoqueDTO::de);
    }
    
    /**
     * Lista apenas itens ativos paginados.
     */
    public Page<ItemEstoqueDTO> listarAtivos(Pageable pageable) {
        return repository.listarAtivosPaginado(pageable)
                .map(ItemEstoqueDTO::de);
    }
    
    /**
     * Busca itens por nome contendo o texto (filtro).
     */
    public Page<ItemEstoqueDTO> buscarPorNome(String nome, Pageable pageable) {
        return repository.buscarPorNomeContendo(nome, pageable)
                .map(ItemEstoqueDTO::de);
    }
}

