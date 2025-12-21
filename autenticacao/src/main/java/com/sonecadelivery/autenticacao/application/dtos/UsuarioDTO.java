package com.sonecadelivery.autenticacao.application.dtos;

import com.sonecadelivery.autenticacao.domain.entities.Usuario;

public record UsuarioDTO(
        String id,
        String nome,
        String email,
        String role,
        String descricaoRole,
        boolean ativo) {
    public static UsuarioDTO de(Usuario usuario) {
        return new UsuarioDTO(
                usuario.getId(),
                usuario.getNome(),
                usuario.getEmail().getValor(),
                usuario.getRole().name(),
                usuario.getRole().getDescricao(),
                usuario.estaAtivo());
    }
}
