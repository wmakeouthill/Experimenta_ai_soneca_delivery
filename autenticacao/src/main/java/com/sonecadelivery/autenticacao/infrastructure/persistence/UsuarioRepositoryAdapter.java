package com.sonecadelivery.autenticacao.infrastructure.persistence;

import com.sonecadelivery.autenticacao.domain.entities.Usuario;
import com.sonecadelivery.autenticacao.domain.ports.UsuarioRepositoryPort;
import com.sonecadelivery.autenticacao.domain.valueobjects.Email;
import com.sonecadelivery.autenticacao.infrastructure.mappers.UsuarioMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class UsuarioRepositoryAdapter implements UsuarioRepositoryPort {

    private final UsuarioJpaRepository jpaRepository;
    private final UsuarioMapper mapper;

    @Override
    @SuppressWarnings("null") // jpaRepository.save() nunca retorna null
    public Usuario salvar(@NonNull Usuario usuario) {
        UsuarioEntity entity = mapper.paraEntity(usuario);
        UsuarioEntity salvo = jpaRepository.save(entity);
        return mapper.paraDomain(salvo);
    }

    @Override
    public Optional<Usuario> buscarPorId(@NonNull String id) {
        return jpaRepository.findById(id)
                .map(mapper::paraDomain);
    }

    @Override
    public Optional<Usuario> buscarPorEmail(Email email) {
        return jpaRepository.findByEmail(email.getValor())
                .map(mapper::paraDomain);
    }

    @Override
    public Optional<Usuario> buscarPorEmailOuNome(String emailOuNome) {
        return jpaRepository.findByEmailOrNome(emailOuNome, emailOuNome)
                .map(mapper::paraDomain);
    }

    @Override
    public List<Usuario> buscarTodos() {
        return jpaRepository.findAll().stream()
                .map(mapper::paraDomain)
                .toList();
    }

    @Override
    public void excluir(@NonNull String id) {
        jpaRepository.deleteById(id);
    }

    @Override
    public boolean existePorEmail(Email email) {
        return jpaRepository.existsByEmail(email.getValor());
    }
}
