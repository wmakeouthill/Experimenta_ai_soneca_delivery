package com.sonecadelivery.autenticacao.application.usecases;

import com.sonecadelivery.autenticacao.application.dtos.UsuarioDTO;
import com.sonecadelivery.autenticacao.domain.entities.Usuario;
import com.sonecadelivery.autenticacao.domain.ports.UsuarioRepositoryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ListarUsuariosUseCase {
    
    private final UsuarioRepositoryPort usuarioRepository;
    
    public List<UsuarioDTO> executar() {
        List<Usuario> usuarios = usuarioRepository.buscarTodos();
        return usuarios.stream()
            .map(UsuarioDTO::de)
            .toList();
    }
}

