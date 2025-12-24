package com.sonecadelivery.pedidos.domain.entities;

import com.sonecadelivery.kernel.domain.entities.BaseEntity;
import com.sonecadelivery.kernel.domain.exceptions.ValidationException;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * Entidade de domínio para Motoboy.
 * Representa um entregador que pode ser atribuído a pedidos de delivery.
 */
@Getter
public class Motoboy extends BaseEntity {
    private String nome; // Nome completo do Google (read-only)
    private String apelido; // Nome exibido, editável pelo admin
    private String telefone;
    private String veiculo;
    private String placa;
    private boolean ativo;
    
    // ========== Campos de Autenticação Google ==========
    private String googleId;
    private String email;
    private String fotoUrl;
    private LocalDateTime ultimoLogin;

    private Motoboy() {
        super();
    }

    public static Motoboy criar(String nome, String telefone, String veiculo, String placa) {
        validarDados(nome, telefone);

        Motoboy motoboy = new Motoboy();
        motoboy.nome = nome.trim();
        motoboy.apelido = null; // Apelido só é definido pelo admin
        motoboy.telefone = telefone.trim();
        motoboy.veiculo = veiculo != null ? veiculo.trim() : null;
        motoboy.placa = placa != null ? placa.trim().toUpperCase() : null;
        motoboy.ativo = true;
        motoboy.touch();
        return motoboy;
    }

    /**
     * Cria motoboy via autenticação Google OAuth.
     */
    public static Motoboy criarViaGoogle(String nome, String email, String googleId, String fotoUrl) {
        if (nome == null || nome.trim().isEmpty()) {
            throw new ValidationException("Nome do motoboy não pode ser nulo ou vazio");
        }
        if (googleId == null || googleId.trim().isEmpty()) {
            throw new ValidationException("Google ID não pode ser nulo ou vazio");
        }

        Motoboy motoboy = new Motoboy();
        motoboy.nome = nome.trim(); // Nome completo do Google
        motoboy.apelido = null; // Apelido será definido pelo admin posteriormente
        motoboy.email = email != null ? email.trim() : null;
        motoboy.googleId = googleId.trim();
        motoboy.fotoUrl = fotoUrl;
        motoboy.telefone = null; // Telefone será preenchido pelo admin ou pelo próprio motoboy
        motoboy.veiculo = null;
        motoboy.placa = null;
        motoboy.ativo = true;
        motoboy.touch();
        return motoboy;
    }

    /**
     * Restaura campos básicos do banco de dados (usado pelos mappers).
     */
    public void restaurarDadosBasicosDoBanco(String apelido, String telefone, String veiculo, String placa, boolean ativo) {
        this.apelido = apelido;
        this.telefone = telefone;
        this.veiculo = veiculo;
        this.placa = placa;
        this.ativo = ativo;
    }

    /**
     * Restaura campos de autenticação do banco de dados (usado pelos mappers).
     */
    public void restaurarAutenticacaoDoBanco(String googleId, String email, String fotoUrl, LocalDateTime ultimoLogin) {
        this.googleId = googleId;
        this.email = email;
        this.fotoUrl = fotoUrl;
        this.ultimoLogin = ultimoLogin;
    }

    /**
     * Restaura o ID e timestamps do banco de dados (usado pelos mappers).
     */
    public void restaurarDoBanco(String id, LocalDateTime createdAt, LocalDateTime updatedAt) {
        restaurarId(id);
        restaurarTimestamps(createdAt, updatedAt);
    }

    public void atualizarNome(String novoNome) {
        if (novoNome == null || novoNome.trim().isEmpty()) {
            throw new ValidationException("Nome do motoboy não pode ser nulo ou vazio");
        }
        this.nome = novoNome.trim();
        touch();
    }

    /**
     * Atualiza o apelido (nome exibido) do motoboy.
     * O apelido é editável apenas pelo administrador.
     */
    public void atualizarApelido(String novoApelido) {
        this.apelido = novoApelido != null && !novoApelido.trim().isEmpty() ? novoApelido.trim() : null;
        touch();
    }

    public void atualizarTelefone(String novoTelefone) {
        // Telefone pode ser nulo (não obrigatório no cadastro via Google)
        this.telefone = novoTelefone != null && !novoTelefone.trim().isEmpty() ? novoTelefone.trim() : null;
        touch();
    }

    public void atualizarVeiculo(String novoVeiculo) {
        this.veiculo = novoVeiculo != null ? novoVeiculo.trim() : null;
        touch();
    }

    public void atualizarPlaca(String novaPlaca) {
        this.placa = novaPlaca != null ? novaPlaca.trim().toUpperCase() : null;
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

    // ========== Métodos de Autenticação Google ==========

    /**
     * Vincula conta Google ao motoboy existente.
     */
    public void vincularGoogle(String googleId, String fotoUrl) {
        if (googleId == null || googleId.trim().isEmpty()) {
            throw new ValidationException("Google ID não pode ser nulo ou vazio");
        }
        this.googleId = googleId.trim();
        this.fotoUrl = fotoUrl;
        touch();
    }

    /**
     * Atualiza foto de perfil.
     */
    public void atualizarFoto(String fotoUrl) {
        this.fotoUrl = fotoUrl;
        touch();
    }

    /**
     * Atualiza email.
     */
    public void atualizarEmail(String novoEmail) {
        this.email = novoEmail != null && !novoEmail.trim().isEmpty() ? novoEmail.trim() : null;
        touch();
    }

    /**
     * Registra último login/acesso.
     */
    public void registrarAcesso() {
        this.ultimoLogin = LocalDateTime.now();
        touch();
    }

    /**
     * Verifica se motoboy tem conta Google vinculada.
     */
    public boolean temContaGoogle() {
        return googleId != null && !googleId.isEmpty();
    }

    /**
     * Retorna o nome a ser exibido (apelido se existir, senão nome completo).
     */
    public String getNomeExibicao() {
        return apelido != null && !apelido.trim().isEmpty() ? apelido : nome;
    }

    private static void validarDados(String nome, String telefone) {
        if (nome == null || nome.trim().isEmpty()) {
            throw new ValidationException("Nome do motoboy não pode ser nulo ou vazio");
        }
        // Telefone não é mais obrigatório (pode ser cadastrado via Google sem telefone)
        // Validação removida para permitir cadastro via Google OAuth
    }
}
