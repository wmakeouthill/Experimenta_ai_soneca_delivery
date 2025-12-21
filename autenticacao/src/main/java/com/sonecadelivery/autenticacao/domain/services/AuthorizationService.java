package com.sonecadelivery.autenticacao.domain.services;

import com.sonecadelivery.autenticacao.domain.entities.Role;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.Set;

@Service
public class AuthorizationService {
    
    private static final Set<String> MODULOS_ADMINISTRADOR = Set.of(
        "cardapio", "sessoes", "historico-sessoes", 
        "relatorios", "relatorio-financeiro", "administracao"
    );
    
    private static final Set<String> MODULOS_OPERADOR = Set.of(
        "pedidos", "lobby-pedidos"
    );
    
    public boolean podeAcessarModulo(String idModulo, Role role) {
        if (role == null) {
            return false;
        }
        
        if (role.isAdministrador()) {
            return true;
        }
        
        if (role.isOperador()) {
            return MODULOS_OPERADOR.contains(idModulo);
        }
        
        return false;
    }
    
    public boolean requerAdministrador(String idModulo) {
        return MODULOS_ADMINISTRADOR.contains(idModulo);
    }
    
    public boolean requerOperador(String idModulo) {
        return MODULOS_OPERADOR.contains(idModulo);
    }
    
    public Role getRoleAtual() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }
        
        Collection<? extends GrantedAuthority> authorities = authentication.getAuthorities();
        
        if (authorities == null || authorities.isEmpty()) {
            return null;
        }
        
        String authority = authorities.iterator().next().getAuthority();
        
        try {
            return Role.fromAuthority(authority);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
    
    public boolean isAdministrador() {
        Role role = getRoleAtual();
        return role != null && role.isAdministrador();
    }
    
    public boolean isOperador() {
        Role role = getRoleAtual();
        return role != null && role.isOperador();
    }
    
    public boolean temRole(Role roleRequerido) {
        Role roleAtual = getRoleAtual();
        if (roleAtual == null || roleRequerido == null) {
            return false;
        }
        return roleAtual == roleRequerido;
    }
    
    public boolean temQualquerRole(Role... rolesRequeridos) {
        Role roleAtual = getRoleAtual();
        if (roleAtual == null || rolesRequeridos == null || rolesRequeridos.length == 0) {
            return false;
        }
        
        for (Role roleRequerido : rolesRequeridos) {
            if (roleAtual == roleRequerido) {
                return true;
            }
        }
        
        return false;
    }
}

