package com.sonecadelivery.cardapio.infrastructure.persistence;

import com.sonecadelivery.cardapio.application.ports.CategoriaRepositoryPort;
import com.sonecadelivery.cardapio.domain.entities.Categoria;
import com.sonecadelivery.cardapio.infrastructure.mappers.CategoriaMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class CategoriaRepositoryAdapter implements CategoriaRepositoryPort {

    private final CategoriaJpaRepository jpaRepository;
    private final CategoriaMapper mapper;

    @Override
    @SuppressWarnings("null") // jpaRepository.save() nunca retorna null
    public Categoria salvar(@NonNull Categoria categoria) {
        CategoriaEntity entity = mapper.paraEntity(categoria);
        CategoriaEntity salva = jpaRepository.save(entity);
        return mapper.paraDomain(salva);
    }

    @Override
    public Optional<Categoria> buscarPorId(@NonNull String id) {
        return jpaRepository.findById(id)
                .map(mapper::paraDomain);
    }

    @Override
    public List<Categoria> buscarTodas() {
        return jpaRepository.findAll().stream()
                .map(mapper::paraDomain)
                .toList();
    }

    @Override
    public List<Categoria> buscarAtivas() {
        return jpaRepository.findByAtivaTrue().stream()
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
