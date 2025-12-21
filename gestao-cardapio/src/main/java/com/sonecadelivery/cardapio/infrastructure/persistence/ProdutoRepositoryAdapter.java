package com.sonecadelivery.cardapio.infrastructure.persistence;

import com.sonecadelivery.cardapio.application.ports.ProdutoRepositoryPort;
import com.sonecadelivery.cardapio.domain.entities.Produto;
import com.sonecadelivery.cardapio.infrastructure.mappers.ProdutoMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class ProdutoRepositoryAdapter implements ProdutoRepositoryPort {

    private final ProdutoJpaRepository jpaRepository;
    private final ProdutoMapper mapper;

    @Override
    @SuppressWarnings("null") // jpaRepository.save() nunca retorna null
    public Produto salvar(@NonNull Produto produto) {
        ProdutoEntity entity = mapper.paraEntity(produto);
        ProdutoEntity salvo = jpaRepository.save(entity);
        return mapper.paraDomain(salvo);
    }

    @Override
    public Optional<Produto> buscarPorId(@NonNull String id) {
        return jpaRepository.findById(id)
                .map(mapper::paraDomain);
    }

    @Override
    public List<Produto> buscarTodos() {
        return jpaRepository.findAll().stream()
                .map(mapper::paraDomain)
                .toList();
    }

    @Override
    public List<Produto> buscarPorCategoria(String categoria) {
        return jpaRepository.findByCategoria(categoria).stream()
                .map(mapper::paraDomain)
                .toList();
    }

    @Override
    public List<Produto> buscarDisponiveis() {
        return jpaRepository.findByDisponivelTrue().stream()
                .map(mapper::paraDomain)
                .toList();
    }

    @Override
    public void excluir(@NonNull String id) {
        jpaRepository.deleteById(id);
    }

    @Override
    public boolean existePorId(@NonNull String id) {
        return jpaRepository.existsById(id);
    }
}
