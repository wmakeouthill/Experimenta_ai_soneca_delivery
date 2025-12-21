package com.snackbar.clientes.application.ports;

import com.snackbar.clientes.domain.entities.Cliente;
import org.springframework.lang.NonNull;

import java.util.List;
import java.util.Optional;

public interface ClienteRepositoryPort {
    Cliente salvar(@NonNull Cliente cliente);

    Optional<Cliente> buscarPorId(@NonNull String id);

    List<Cliente> buscarTodos();

    List<Cliente> buscarPorTelefone(String telefone);

    List<Cliente> buscarPorNome(String nome);

    Optional<Cliente> buscarPorGoogleId(String googleId);

    Optional<Cliente> buscarPorEmail(String email);

    boolean existePorGoogleId(String googleId);

    boolean existePorTelefone(String telefone);

    boolean existePorEmail(String email);
}
