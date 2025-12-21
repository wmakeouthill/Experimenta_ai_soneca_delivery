package com.sonecadelivery.clientes.infrastructure.persistence;

import com.sonecadelivery.clientes.application.ports.ClienteRepositoryPort;
import com.sonecadelivery.clientes.domain.entities.Cliente;
import com.sonecadelivery.clientes.infrastructure.mappers.ClienteMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class ClienteRepositoryAdapter implements ClienteRepositoryPort {

    private final ClienteJpaRepository jpaRepository;
    private final ClienteMapper mapper;

    @Override
    @SuppressWarnings("null") // jpaRepository.save() nunca retorna null
    public Cliente salvar(@NonNull Cliente cliente) {
        ClienteEntity entity = mapper.paraEntity(cliente);
        ClienteEntity salvo = jpaRepository.save(entity);
        return mapper.paraDomain(salvo);
    }

    @Override
    public Optional<Cliente> buscarPorId(@NonNull String id) {
        return jpaRepository.findById(id)
                .map(mapper::paraDomain);
    }

    @Override
    public List<Cliente> buscarTodos() {
        return jpaRepository.findAll().stream()
                .map(mapper::paraDomain)
                .toList();
    }

    @Override
    public List<Cliente> buscarPorTelefone(String telefone) {
        return jpaRepository.findByTelefone(telefone).stream()
                .map(mapper::paraDomain)
                .toList();
    }

    @Override
    public List<Cliente> buscarPorNome(String nome) {
        return jpaRepository.findByNomeContainingIgnoreCase(nome).stream()
                .map(mapper::paraDomain)
                .toList();
    }

    @Override
    public Optional<Cliente> buscarPorGoogleId(String googleId) {
        return jpaRepository.findByGoogleId(googleId)
                .map(mapper::paraDomain);
    }

    @Override
    public Optional<Cliente> buscarPorEmail(String email) {
        return jpaRepository.findByEmail(email)
                .map(mapper::paraDomain);
    }

    @Override
    public boolean existePorGoogleId(String googleId) {
        return jpaRepository.existsByGoogleId(googleId);
    }

    @Override
    public boolean existePorTelefone(String telefone) {
        return jpaRepository.existsByTelefone(telefone);
    }

    @Override
    public boolean existePorEmail(String email) {
        return jpaRepository.existsByEmail(email);
    }
}
