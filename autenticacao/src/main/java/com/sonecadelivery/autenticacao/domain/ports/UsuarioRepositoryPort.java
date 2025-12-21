package com.sonecadelivery.autenticacao.domain.ports;

import com.sonecadelivery.autenticacao.domain.entities.Usuario;
import com.sonecadelivery.autenticacao.domain.valueobjects.Email;
import org.springframework.lang.NonNull;

import java.util.List;
import java.util.Optional;

public interface UsuarioRepositoryPort {
    Usuario salvar(@NonNull Usuario usuario);
    Optional<Usuario> buscarPorId(@NonNull String id);
    Optional<Usuario> buscarPorEmail(Email email);
    Optional<Usuario> buscarPorEmailOuNome(String emailOuNome);
    List<Usuario> buscarTodos();
    void excluir(@NonNull String id);
    boolean existePorEmail(Email email);
}

