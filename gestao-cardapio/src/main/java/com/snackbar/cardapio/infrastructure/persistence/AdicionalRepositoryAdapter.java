package com.snackbar.cardapio.infrastructure.persistence;

import com.snackbar.cardapio.application.ports.AdicionalRepositoryPort;
import com.snackbar.cardapio.domain.entities.Adicional;
import com.snackbar.cardapio.infrastructure.mappers.AdicionalMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class AdicionalRepositoryAdapter implements AdicionalRepositoryPort {

    private final AdicionalJpaRepository jpaRepository;
    private final AdicionalMapper mapper;

    @Override
    @SuppressWarnings("null")
    public Adicional salvar(@NonNull Adicional adicional) {
        AdicionalEntity entity = mapper.paraEntity(adicional);
        AdicionalEntity salvo = jpaRepository.save(entity);
        return mapper.paraDomain(salvo);
    }

    @Override
    public Optional<Adicional> buscarPorId(@NonNull String id) {
        return jpaRepository.findById(id)
                .map(mapper::paraDomain);
    }

    @Override
    public List<Adicional> buscarTodos() {
        return jpaRepository.findAll().stream()
                .map(mapper::paraDomain)
                .toList();
    }

    @Override
    public List<Adicional> buscarDisponiveis() {
        return jpaRepository.findByDisponivelTrue().stream()
                .map(mapper::paraDomain)
                .toList();
    }

    @Override
    public List<Adicional> buscarPorCategoria(String categoria) {
        return jpaRepository.findByCategoria(categoria).stream()
                .map(mapper::paraDomain)
                .toList();
    }

    @Override
    public List<Adicional> buscarPorIds(List<String> ids) {
        if (ids == null || ids.isEmpty()) {
            return List.of();
        }
        return jpaRepository.findByIdIn(ids).stream()
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
