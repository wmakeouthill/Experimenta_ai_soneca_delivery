package com.sonecadelivery.clientes.domain.entities;

import com.sonecadelivery.kernel.domain.entities.BaseEntity;
import com.sonecadelivery.kernel.domain.exceptions.ValidationException;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class Cliente extends BaseEntity {
    private String nome;
    private String telefone;
    private String email;
    private String cpf;
    private String observacoes;

    // ========== Campos de Autenticação ==========
    private String senhaHash;
    private String googleId;
    private String fotoUrl;
    private boolean emailVerificado;
    private LocalDateTime ultimoLogin;

    // ========== Campos de Endereço (Delivery) ==========
    private String logradouro;
    private String numero;
    private String complemento;
    private String bairro;
    private String cidade;
    private String estado;
    private String cep;
    private String pontoReferencia;

    private Cliente() {
        super();
    }

    public static Cliente criar(String nome, String telefone, String email, String cpf, String observacoes) {
        validarDados(nome, telefone);

        Cliente cliente = new Cliente();
        cliente.nome = nome.trim();
        cliente.telefone = telefone != null ? telefone.trim() : null;
        cliente.email = email != null && !email.trim().isEmpty() ? email.trim() : null;
        cliente.cpf = cpf != null && !cpf.trim().isEmpty() ? cpf.trim() : null;
        cliente.observacoes = observacoes != null ? observacoes.trim() : null;
        cliente.emailVerificado = false;
        cliente.touch();
        return cliente;
    }

    /**
     * Cria cliente via autenticação Google OAuth.
     */
    public static Cliente criarViaGoogle(String nome, String email, String googleId, String fotoUrl) {
        if (nome == null || nome.trim().isEmpty()) {
            throw new ValidationException("Nome do cliente não pode ser nulo ou vazio");
        }
        if (googleId == null || googleId.trim().isEmpty()) {
            throw new ValidationException("Google ID não pode ser nulo ou vazio");
        }

        Cliente cliente = new Cliente();
        cliente.nome = nome.trim();
        cliente.email = email != null ? email.trim() : null;
        cliente.googleId = googleId.trim();
        cliente.fotoUrl = fotoUrl;
        cliente.emailVerificado = true; // Email do Google já é verificado
        cliente.touch();
        return cliente;
    }

    public void atualizarNome(String novoNome) {
        if (novoNome == null || novoNome.trim().isEmpty()) {
            throw new ValidationException("Nome do cliente não pode ser nulo ou vazio");
        }
        this.nome = novoNome.trim();
        touch();
    }

    public void atualizarTelefone(String novoTelefone) {
        this.telefone = novoTelefone != null ? novoTelefone.trim() : null;
        touch();
    }

    public void atualizarEmail(String novoEmail) {
        this.email = novoEmail != null && !novoEmail.trim().isEmpty() ? novoEmail.trim() : null;
        touch();
    }

    public void atualizarCpf(String novoCpf) {
        this.cpf = novoCpf != null && !novoCpf.trim().isEmpty() ? novoCpf.trim() : null;
        touch();
    }

    public void atualizarObservacoes(String novasObservacoes) {
        this.observacoes = novasObservacoes != null ? novasObservacoes.trim() : null;
        touch();
    }

    // ========== Métodos de Endereço ==========

    /**
     * Atualiza o endereço completo do cliente.
     */
    public void atualizarEndereco(String logradouro, String numero, String complemento,
            String bairro, String cidade, String estado, String cep, String pontoReferencia) {
        this.logradouro = logradouro != null ? logradouro.trim() : null;
        this.numero = numero != null ? numero.trim() : null;
        this.complemento = complemento != null ? complemento.trim() : null;
        this.bairro = bairro != null ? bairro.trim() : null;
        this.cidade = cidade != null ? cidade.trim() : null;
        this.estado = estado != null ? estado.trim().toUpperCase() : null;
        this.cep = cep != null ? cep.replaceAll("\\D", "") : null;
        this.pontoReferencia = pontoReferencia != null ? pontoReferencia.trim() : null;
        touch();
    }

    /**
     * Retorna o endereço formatado para exibição.
     */
    public String getEnderecoFormatado() {
        if (logradouro == null || logradouro.isEmpty()) {
            return null;
        }
        StringBuilder sb = new StringBuilder();
        sb.append(logradouro);
        if (numero != null && !numero.isEmpty()) {
            sb.append(", ").append(numero);
        }
        if (complemento != null && !complemento.isEmpty()) {
            sb.append(" - ").append(complemento);
        }
        if (bairro != null && !bairro.isEmpty()) {
            sb.append(", ").append(bairro);
        }
        if (cidade != null && !cidade.isEmpty()) {
            sb.append(" - ").append(cidade);
        }
        if (estado != null && !estado.isEmpty()) {
            sb.append("/").append(estado);
        }
        if (cep != null && !cep.isEmpty()) {
            sb.append(", CEP: ").append(formatarCep(cep));
        }
        return sb.toString();
    }

    private String formatarCep(String cep) {
        if (cep == null || cep.length() != 8)
            return cep;
        return cep.substring(0, 5) + "-" + cep.substring(5);
    }

    /**
     * Verifica se o cliente tem endereço cadastrado.
     */
    public boolean temEndereco() {
        return logradouro != null && !logradouro.isEmpty()
                && numero != null && !numero.isEmpty()
                && bairro != null && !bairro.isEmpty()
                && cidade != null && !cidade.isEmpty();
    }

    // ========== Métodos de Autenticação ==========

    /**
     * Define a senha do cliente (hash BCrypt).
     */
    public void definirSenha(String senhaHash) {
        this.senhaHash = senhaHash;
        touch();
    }

    /**
     * Vincula conta Google ao cliente existente.
     */
    public void vincularContaGoogle(String googleId, String fotoUrl) {
        if (googleId == null || googleId.trim().isEmpty()) {
            throw new ValidationException("Google ID não pode ser nulo ou vazio");
        }
        this.googleId = googleId.trim();
        this.fotoUrl = fotoUrl;
        this.emailVerificado = true;
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
     * Marca email como verificado.
     */
    public void verificarEmail() {
        this.emailVerificado = true;
        touch();
    }

    /**
     * Registra último login.
     */
    public void registrarLogin() {
        this.ultimoLogin = LocalDateTime.now();
        touch();
    }

    /**
     * Verifica se cliente tem senha definida (pode fazer login com telefone/senha).
     */
    public boolean temSenha() {
        return senhaHash != null && !senhaHash.isEmpty();
    }

    /**
     * Verifica se cliente tem conta Google vinculada.
     */
    public boolean temContaGoogle() {
        return googleId != null && !googleId.isEmpty();
    }

    /**
     * Alias para temContaGoogle - usado pelos use cases.
     */
    public boolean temGoogleVinculado() {
        return temContaGoogle();
    }

    /**
     * Vincula conta Google ao cliente.
     */
    public void vincularGoogle(String googleId, String fotoUrl) {
        vincularContaGoogle(googleId, fotoUrl);
    }

    /**
     * Desvincula conta Google do cliente.
     */
    public void desvincularGoogle() {
        this.googleId = null;
        this.fotoUrl = null;
        touch();
    }

    /**
     * Registra acesso/login do cliente.
     */
    public void registrarAcesso() {
        registrarLogin();
    }

    /**
     * Restaura o ID e timestamps do banco de dados (usado pelos mappers).
     */
    public void restaurarDoBanco(String id, LocalDateTime createdAt, LocalDateTime updatedAt) {
        restaurarId(id);
        restaurarTimestamps(createdAt, updatedAt);
    }

    /**
     * Restaura campos de autenticação do banco de dados (usado pelos mappers).
     */
    public void restaurarAutenticacaoDoBanco(String senhaHash, String googleId, String fotoUrl,
            boolean emailVerificado, LocalDateTime ultimoLogin) {
        this.senhaHash = senhaHash;
        this.googleId = googleId;
        this.fotoUrl = fotoUrl;
        this.emailVerificado = emailVerificado;
        this.ultimoLogin = ultimoLogin;
    }

    /**
     * Restaura campos de endereço do banco de dados (usado pelos mappers).
     */
    public void restaurarEnderecoDoBanco(String logradouro, String numero, String complemento,
            String bairro, String cidade, String estado, String cep, String pontoReferencia) {
        this.logradouro = logradouro;
        this.numero = numero;
        this.complemento = complemento;
        this.bairro = bairro;
        this.cidade = cidade;
        this.estado = estado;
        this.cep = cep;
        this.pontoReferencia = pontoReferencia;
    }

    private static void validarDados(String nome, String telefone) {
        if (nome == null || nome.trim().isEmpty()) {
            throw new ValidationException("Nome do cliente não pode ser nulo ou vazio");
        }
        if (telefone == null || telefone.isBlank()) {
            throw new ValidationException("Telefone do cliente não pode ser nulo ou vazio");
        }
    }
}
