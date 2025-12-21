package com.sonecadelivery.pedidos.infrastructure.persistence.adapters;

import com.sonecadelivery.pedidos.application.ports.MesaRepositoryPort;
import com.sonecadelivery.pedidos.domain.entities.Mesa;
import com.sonecadelivery.pedidos.infrastructure.persistence.entities.MesaEntity;
import com.sonecadelivery.pedidos.infrastructure.persistence.mappers.MesaMapper;
import com.sonecadelivery.pedidos.infrastructure.persistence.repositories.MesaJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

/**
 * Adaptador que implementa o port de repositório de Mesa.
 * Conecta a camada de domínio com a persistência JPA.
 */
@Component
@RequiredArgsConstructor
public class MesaRepositoryAdapter implements MesaRepositoryPort {

    private final MesaJpaRepository jpaRepository;
    private final MesaMapper mapper;

    @Override
    public Mesa salvar(@NonNull Mesa mesa) {
        MesaEntity entity = mapper.paraEntity(mesa);
        MesaEntity salvo = jpaRepository.save(entity);
        return mapper.paraDomain(salvo);
    }

    @Override
    public Optional<Mesa> buscarPorId(@NonNull String id) {
        return jpaRepository.findById(id)
                .map(mapper::paraDomain);
    }

    @Override
    public Optional<Mesa> buscarPorNumero(int numero) {
        return jpaRepository.findByNumero(numero)
                .map(mapper::paraDomain);
    }

    @Override
    public Optional<Mesa> buscarPorQrCodeToken(@NonNull String token) {
        return jpaRepository.findByQrCodeToken(token)
                .map(mapper::paraDomain);
    }

    @Override
    public List<Mesa> buscarTodas() {
        return jpaRepository.findAllByOrderByNumeroAsc().stream()
                .map(mapper::paraDomain)
                .toList();
    }

    @Override
    public List<Mesa> buscarAtivas() {
        return jpaRepository.findByAtivaTrue().stream()
                .map(mapper::paraDomain)
                .toList();
    }

    @Override
    public void excluir(@NonNull String id) {
        jpaRepository.deleteById(id);
    }

    @Override
    public boolean existePorNumero(int numero) {
        return jpaRepository.existsByNumero(numero);
    }

    @Override
    public boolean existePorNumeroExcetoId(int numero, @NonNull String id) {
        return jpaRepository.existsByNumeroAndIdNot(numero, id);
    }
}
