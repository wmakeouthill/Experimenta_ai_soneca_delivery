package com.sonecadelivery.pedidos.application.ports;

import com.sonecadelivery.pedidos.domain.entities.ItemEstoque;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Optional;

/**
 * Port (interface) do repositório de itens de estoque.
 * Define as operações de persistência disponíveis para a camada de aplicação.
 */
public interface ItemEstoqueRepositoryPort {
    
    /**
     * Salva um item de estoque.
     */
    ItemEstoque salvar(ItemEstoque item);
    
    /**
     * Busca um item pelo ID.
     */
    Optional<ItemEstoque> buscarPorId(String id);
    
    /**
     * Busca um item pelo nome.
     */
    Optional<ItemEstoque> buscarPorNome(String nome);
    
    /**
     * Lista todos os itens de estoque paginados.
     */
    Page<ItemEstoque> listarPaginado(Pageable pageable);
    
    /**
     * Lista apenas itens ativos paginados.
     */
    Page<ItemEstoque> listarAtivosPaginado(Pageable pageable);
    
    /**
     * Busca itens por nome contendo o texto (filtro).
     */
    Page<ItemEstoque> buscarPorNomeContendo(String nome, Pageable pageable);
    
    /**
     * Verifica se existe um item com o nome informado.
     */
    boolean existePorNome(String nome);
    
    /**
     * Verifica se existe outro item com o nome informado (excluindo o ID atual).
     */
    boolean existePorNomeEIdDiferente(String nome, String id);
    
    /**
     * Remove um item de estoque.
     */
    void remover(String id);
}

