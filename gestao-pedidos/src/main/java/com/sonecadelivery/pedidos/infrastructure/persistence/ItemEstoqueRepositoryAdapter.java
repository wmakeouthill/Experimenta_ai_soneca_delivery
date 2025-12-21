package com.sonecadelivery.pedidos.infrastructure.persistence;

import com.sonecadelivery.pedidos.application.ports.ItemEstoqueRepositoryPort;
import com.sonecadelivery.pedidos.domain.entities.ItemEstoque;
import com.sonecadelivery.pedidos.infrastructure.mappers.ItemEstoqueMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

import java.util.Optional;

/**
 * Adapter que implementa o port do repositório de itens de estoque.
 */
@Component
@RequiredArgsConstructor
public class ItemEstoqueRepositoryAdapter implements ItemEstoqueRepositoryPort {
    
    private final ItemEstoqueJpaRepository jpaRepository;
    private final ItemEstoqueMapper mapper;
    
    @Override
    public ItemEstoque salvar(ItemEstoque item) {
        ItemEstoqueEntity entity = mapper.paraEntity(item);
        ItemEstoqueEntity salvo = jpaRepository.save(entity);
        return mapper.paraDomain(salvo);
    }
    
    @Override
    public Optional<ItemEstoque> buscarPorId(String id) {
        return jpaRepository.findById(id)
                .map(mapper::paraDomain);
    }
    
    @Override
    public Optional<ItemEstoque> buscarPorNome(String nome) {
        return jpaRepository.findByNomeIgnoreCase(nome)
                .map(mapper::paraDomain);
    }
    
    @Override
    public Page<ItemEstoque> listarPaginado(Pageable pageable) {
        return jpaRepository.findAll(pageable)
                .map(mapper::paraDomain);
    }
    
    @Override
    public Page<ItemEstoque> listarAtivosPaginado(Pageable pageable) {
        return jpaRepository.findByAtivoTrue(pageable)
                .map(mapper::paraDomain);
    }
    
    @Override
    public Page<ItemEstoque> buscarPorNomeContendo(String nome, Pageable pageable) {
        return jpaRepository.findByNomeContainingIgnoreCase(nome, pageable)
                .map(mapper::paraDomain);
    }
    
    @Override
    public boolean existePorNome(String nome) {
        return jpaRepository.existsByNomeIgnoreCase(nome);
    }
    
    @Override
    public boolean existePorNomeEIdDiferente(String nome, String id) {
        return jpaRepository.existsByNomeIgnoreCaseAndIdNot(nome, id);
    }
    
    @Override
    public void remover(String id) {
        jpaRepository.deleteById(id);
    }
}

