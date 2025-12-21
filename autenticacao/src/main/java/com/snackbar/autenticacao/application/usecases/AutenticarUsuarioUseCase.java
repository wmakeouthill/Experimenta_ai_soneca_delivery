package com.snackbar.autenticacao.application.usecases;

import com.snackbar.autenticacao.application.dtos.LoginRequest;
import com.snackbar.autenticacao.application.dtos.LoginResponse;
import com.snackbar.autenticacao.application.dtos.UsuarioDTO;
import com.snackbar.autenticacao.domain.entities.Usuario;
import com.snackbar.autenticacao.domain.ports.UsuarioRepositoryPort;
import com.snackbar.autenticacao.domain.services.JwtService;
import com.snackbar.autenticacao.domain.services.SenhaService;
import com.snackbar.kernel.domain.exceptions.ValidationException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AutenticarUsuarioUseCase {
    
    private final UsuarioRepositoryPort usuarioRepository;
    private final SenhaService senhaService;
    private final JwtService jwtService;
    
    public LoginResponse executar(LoginRequest request) {
        Usuario usuario = buscarUsuarioPorEmailOuNome(request.emailOuUsuario());
        validarUsuarioAtivo(usuario);
        validarSenha(request.senha(), usuario);
        
        String token = jwtService.gerarToken(usuario);
        UsuarioDTO usuarioDTO = UsuarioDTO.de(usuario);
        
        return LoginResponse.of(token, usuarioDTO);
    }
    
    private Usuario buscarUsuarioPorEmailOuNome(String emailOuNome) {
        return usuarioRepository.buscarPorEmailOuNome(emailOuNome.trim())
            .orElseThrow(() -> new ValidationException("Credenciais inválidas"));
    }
    
    private void validarUsuarioAtivo(Usuario usuario) {
        if (!usuario.estaAtivo()) {
            throw new ValidationException("Usuário inativo");
        }
    }
    
    private void validarSenha(String senhaPlana, Usuario usuario) {
        boolean senhaValida = senhaService.verificarSenha(
            senhaPlana, 
            usuario.getSenha().getHash()
        );
        
        if (!senhaValida) {
            throw new ValidationException("Credenciais inválidas");
        }
    }
}

