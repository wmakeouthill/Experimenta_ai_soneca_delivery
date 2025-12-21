package com.snackbar.autenticacao.infrastructure.mappers;

import com.snackbar.autenticacao.domain.entities.Role;
import com.snackbar.autenticacao.domain.entities.Usuario;
import com.snackbar.autenticacao.domain.valueobjects.Email;
import com.snackbar.autenticacao.domain.valueobjects.Senha;
import com.snackbar.autenticacao.infrastructure.persistence.UsuarioEntity;
import org.springframework.stereotype.Component;

@Component
public class UsuarioMapper {
    
    public UsuarioEntity paraEntity(Usuario usuario) {
        UsuarioEntity entity = new UsuarioEntity();
        entity.setId(usuario.getId());
        entity.setNome(usuario.getNome());
        entity.setEmail(usuario.getEmail().getValor());
        entity.setSenhaHash(usuario.getSenha().getHash());
        entity.setRole(converterRole(usuario.getRole()));
        entity.setAtivo(usuario.estaAtivo());
        entity.setCreatedAt(usuario.getCreatedAt());
        entity.setUpdatedAt(usuario.getUpdatedAt());
        return entity;
    }
    
    public Usuario paraDomain(UsuarioEntity entity) {
        Email email = Email.of(entity.getEmail());
        Senha senha = Senha.restaurarHash(entity.getSenhaHash());
        Role role = converterRoleEntity(entity.getRole());
        
        Usuario usuario = Usuario.criar(
            entity.getNome(),
            email,
            senha,
            role
        );
        
        usuario.restaurarDoBanco(
            entity.getId(),
            entity.getCreatedAt(),
            entity.getUpdatedAt(),
            entity.getNome(),
            email,
            senha,
            role,
            entity.getAtivo()
        );
        
        return usuario;
    }
    
    private UsuarioEntity.RoleEntity converterRole(Role role) {
        return switch (role) {
            case ADMINISTRADOR -> UsuarioEntity.RoleEntity.ADMINISTRADOR;
            case OPERADOR -> UsuarioEntity.RoleEntity.OPERADOR;
        };
    }
    
    private Role converterRoleEntity(UsuarioEntity.RoleEntity roleEntity) {
        return switch (roleEntity) {
            case ADMINISTRADOR -> Role.ADMINISTRADOR;
            case OPERADOR -> Role.OPERADOR;
        };
    }
}

