package com.snackbar.autenticacao.application.usecases;

import com.snackbar.autenticacao.domain.ports.UsuarioRepositoryPort;
import com.snackbar.kernel.domain.exceptions.ValidationException;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ExcluirUsuarioUseCase {
    
    private final UsuarioRepositoryPort usuarioRepository;
    
    public void executar(@NonNull String id) {
        validarUsuarioExiste(id);
        usuarioRepository.excluir(id);
    }
    
    private void validarUsuarioExiste(@NonNull String id) {
        if (!usuarioRepository.buscarPorId(id).isPresent()) {
            throw new ValidationException("Usuário não encontrado");
        }
    }
}

