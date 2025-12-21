package com.snackbar.autenticacao.application.usecases;

import com.snackbar.autenticacao.application.dtos.AtualizarUsuarioRequest;
import com.snackbar.autenticacao.application.dtos.UsuarioDTO;
import com.snackbar.autenticacao.domain.entities.Usuario;
import com.snackbar.autenticacao.domain.ports.UsuarioRepositoryPort;
import com.snackbar.kernel.domain.exceptions.ValidationException;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AtualizarUsuarioUseCase {

    private final UsuarioRepositoryPort usuarioRepository;

    public UsuarioDTO executar(@NonNull String id, AtualizarUsuarioRequest request) {
        Usuario usuario = buscarUsuario(id);
        aplicarAtualizacoes(usuario, request);

        @SuppressWarnings("null") // repository.salvar() nunca retorna null
        Usuario usuarioAtualizado = usuarioRepository.salvar(usuario);
        return UsuarioDTO.de(usuarioAtualizado);
    }

    private Usuario buscarUsuario(@NonNull String id) {
        return usuarioRepository.buscarPorId(id)
                .orElseThrow(() -> new ValidationException("Usuário não encontrado"));
    }

    private void aplicarAtualizacoes(Usuario usuario, AtualizarUsuarioRequest request) {
        if (request.nome() != null && !request.nome().trim().isEmpty()) {
            usuario.atualizarNome(request.nome());
        }

        if (request.role() != null) {
            usuario.alterarRole(request.role());
        }

        if (request.ativo() != null) {
            if (Boolean.TRUE.equals(request.ativo())) {
                usuario.ativar();
            } else {
                usuario.desativar();
            }
        }
    }
}
