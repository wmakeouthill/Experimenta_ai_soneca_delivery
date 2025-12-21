package com.sonecadelivery.autenticacao.application.usecases;

import com.sonecadelivery.autenticacao.application.dtos.CriarUsuarioRequest;
import com.sonecadelivery.autenticacao.application.dtos.UsuarioDTO;
import com.sonecadelivery.autenticacao.domain.entities.Usuario;
import com.sonecadelivery.autenticacao.domain.ports.UsuarioRepositoryPort;
import com.sonecadelivery.autenticacao.domain.services.SenhaService;
import com.sonecadelivery.autenticacao.domain.valueobjects.Email;
import com.sonecadelivery.kernel.domain.exceptions.ValidationException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CriarUsuarioUseCase {

    private final UsuarioRepositoryPort usuarioRepository;
    private final SenhaService senhaService;

    public UsuarioDTO executar(CriarUsuarioRequest request) {
        Email email = Email.of(request.email());
        validarEmailUnico(email);

        var senhaComHash = senhaService.criarSenhaComHash(request.senha());
        Usuario usuario = Usuario.criar(
                request.nome(),
                email,
                senhaComHash,
                request.role());

        @SuppressWarnings("null") // repository.salvar() nunca retorna null
        Usuario usuarioSalvo = usuarioRepository.salvar(usuario);
        return UsuarioDTO.de(usuarioSalvo);
    }

    private void validarEmailUnico(Email email) {
        if (usuarioRepository.existePorEmail(email)) {
            throw new ValidationException("Email já está em uso");
        }
    }
}
