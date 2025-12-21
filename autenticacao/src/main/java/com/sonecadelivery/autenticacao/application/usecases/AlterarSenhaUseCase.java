package com.sonecadelivery.autenticacao.application.usecases;

import com.sonecadelivery.autenticacao.application.dtos.AlterarSenhaRequest;
import com.sonecadelivery.autenticacao.domain.entities.Usuario;
import com.sonecadelivery.autenticacao.domain.ports.UsuarioRepositoryPort;
import com.sonecadelivery.autenticacao.domain.services.SenhaService;
import com.sonecadelivery.kernel.domain.exceptions.ValidationException;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AlterarSenhaUseCase {

    private final UsuarioRepositoryPort usuarioRepository;
    private final SenhaService senhaService;

    public void executar(@NonNull String usuarioId, AlterarSenhaRequest request) {
        Usuario usuario = buscarUsuario(usuarioId);
        validarSenhaAtual(request.senhaAtual(), usuario);

        var novaSenha = senhaService.criarSenhaComHash(request.novaSenha());
        usuario.atualizarSenha(novaSenha);

        usuarioRepository.salvar(usuario);
    }

    private Usuario buscarUsuario(@NonNull String id) {
        return usuarioRepository.buscarPorId(id)
                .orElseThrow(() -> new ValidationException("Usuário não encontrado"));
    }

    private void validarSenhaAtual(String senhaPlana, Usuario usuario) {
        boolean senhaValida = senhaService.verificarSenha(
                senhaPlana,
                usuario.getSenha().getHash());

        if (!senhaValida) {
            throw new ValidationException("Senha atual incorreta");
        }
    }
}
