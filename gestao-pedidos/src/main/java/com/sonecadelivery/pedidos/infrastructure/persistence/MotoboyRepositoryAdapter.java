package com.sonecadelivery.pedidos.infrastructure.persistence;

import com.sonecadelivery.pedidos.application.ports.MotoboyRepositoryPort;
import com.sonecadelivery.pedidos.domain.entities.Motoboy;
import com.sonecadelivery.pedidos.infrastructure.mappers.MotoboyMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Adapter do repositório de Motoboy que implementa o port de aplicação.
 */
@Repository
@RequiredArgsConstructor
public class MotoboyRepositoryAdapter implements MotoboyRepositoryPort {

    private final MotoboyJpaRepository jpaRepository;

    @Override
    public Motoboy salvar(Motoboy motoboy) {
        MotoboyEntity entity = MotoboyMapper.toEntity(motoboy);
        MotoboyEntity saved = jpaRepository.save(entity);
        return MotoboyMapper.toDomain(saved);
    }

    @Override
    public Optional<Motoboy> buscarPorId(String id) {
        return jpaRepository.findById(id)
                .map(MotoboyMapper::toDomain);
    }

    @Override
    public List<Motoboy> buscarPorIds(Collection<String> ids) {
        if (ids == null || ids.isEmpty()) {
            return Collections.emptyList();
        }
        return jpaRepository.findByIdIn(ids)
                .stream()
                .map(MotoboyMapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public Optional<Motoboy> buscarPorTelefone(String telefone) {
        return jpaRepository.findByTelefone(telefone)
                .map(MotoboyMapper::toDomain);
    }

    @Override
    public Optional<Motoboy> buscarPorGoogleId(String googleId) {
        return jpaRepository.findByGoogleId(googleId)
                .map(MotoboyMapper::toDomain);
    }

    @Override
    public Optional<Motoboy> buscarPorEmail(String email) {
        return jpaRepository.findByEmail(email)
                .map(MotoboyMapper::toDomain);
    }

    @Override
    public List<Motoboy> listarTodos() {
        return jpaRepository.findAllByOrderByNomeAsc()
                .stream()
                .map(MotoboyMapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<Motoboy> listarAtivos() {
        return jpaRepository.findByAtivoTrueOrderByNomeAsc()
                .stream()
                .map(MotoboyMapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public boolean existePorTelefone(String telefone) {
        return jpaRepository.existsByTelefone(telefone);
    }

    @Override
    public boolean existePorTelefoneEIdDiferente(String telefone, String id) {
        return jpaRepository.existsByTelefoneAndIdNot(telefone, id);
    }

    @Override
    public void excluir(String id) {
        jpaRepository.deleteById(id);
    }
}
