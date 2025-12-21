package com.sonecadelivery.autenticacao.domain.entities;

import com.sonecadelivery.autenticacao.domain.valueobjects.Email;
import com.sonecadelivery.autenticacao.domain.valueobjects.Senha;
import com.sonecadelivery.kernel.domain.entities.BaseEntity;
import com.sonecadelivery.kernel.domain.exceptions.ValidationException;
import lombok.Getter;

@Getter
public class Usuario extends BaseEntity {
    private String nome;
    private Email email;
    private Senha senha;
    private Role role;
    private boolean ativo;

    private record DadosUsuario(String nome, Email email, Senha senha, Role role, boolean ativo) {
    }

    private Usuario() {
        super();
    }

    public static Usuario criar(String nome, Email email, Senha senha, Role role) {
        validarDados(nome, email, senha, role);

        Usuario usuario = new Usuario();
        usuario.nome = nome.trim();
        usuario.email = email;
        usuario.senha = senha;
        usuario.role = role;
        usuario.ativo = true;
        usuario.touch();
        return usuario;
    }

    public void atualizarNome(String novoNome) {
        if (novoNome == null || novoNome.trim().isEmpty()) {
            throw new ValidationException("Nome não pode ser nulo ou vazio");
        }
        this.nome = novoNome.trim();
        touch();
    }

    public void atualizarSenha(Senha novaSenha) {
        if (novaSenha == null) {
            throw new ValidationException("Senha não pode ser nula");
        }
        this.senha = novaSenha;
        touch();
    }

    public void alterarRole(Role novaRole) {
        if (novaRole == null) {
            throw new ValidationException("Role não pode ser nula");
        }
        this.role = novaRole;
        touch();
    }

    public void ativar() {
        this.ativo = true;
        touch();
    }

    public void desativar() {
        this.ativo = false;
        touch();
    }

    public boolean estaAtivo() {
        return ativo;
    }

    public boolean isAdministrador() {
        return role != null && role.isAdministrador();
    }

    public boolean isOperador() {
        return role != null && role.isOperador();
    }

    public void restaurarDoBanco(String id, java.time.LocalDateTime createdAt,
            java.time.LocalDateTime updatedAt, DadosUsuario dados) {
        restaurarId(id);
        restaurarTimestamps(createdAt, updatedAt);
        this.nome = dados.nome();
        this.email = dados.email();
        this.senha = dados.senha();
        this.role = dados.role();
        this.ativo = dados.ativo();
    }

    @SuppressWarnings("java:S107") // Método de compatibilidade mantido para mappers existentes
    public void restaurarDoBanco(String id, java.time.LocalDateTime createdAt,
            java.time.LocalDateTime updatedAt, String nome,
            Email email, Senha senha, Role role, boolean ativo) {
        restaurarDoBanco(id, createdAt, updatedAt, new DadosUsuario(nome, email, senha, role, ativo));
    }

    private static void validarDados(String nome, Email email, Senha senha, Role role) {
        if (nome == null || nome.trim().isEmpty()) {
            throw new ValidationException("Nome não pode ser nulo ou vazio");
        }
        if (email == null) {
            throw new ValidationException("Email não pode ser nulo");
        }
        if (senha == null) {
            throw new ValidationException("Senha não pode ser nula");
        }
        if (role == null) {
            throw new ValidationException("Role não pode ser nula");
        }
    }
}
