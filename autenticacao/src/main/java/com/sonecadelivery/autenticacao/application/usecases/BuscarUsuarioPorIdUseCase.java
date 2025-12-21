package com.sonecadelivery.autenticacao.application.usecases;

import com.sonecadelivery.autenticacao.application.dtos.UsuarioDTO;
import com.sonecadelivery.autenticacao.domain.entities.Usuario;
import com.sonecadelivery.autenticacao.domain.ports.UsuarioRepositoryPort;
import com.sonecadelivery.kernel.domain.exceptions.ValidationException;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class BuscarUsuarioPorIdUseCase {
    
    private final UsuarioRepositoryPort usuarioRepository;
    
    @SuppressWarnings("null") // .orElseThrow() nunca retorna null
    public UsuarioDTO executar(@NonNull String id) {
        Usuario usuario = usuarioRepository.buscarPorId(id)
            .orElseThrow(() -> new ValidationException("Usuário não encontrado"));
        
        return UsuarioDTO.de(usuario);
    }
}

