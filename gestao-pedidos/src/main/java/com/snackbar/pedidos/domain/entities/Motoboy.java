package com.snackbar.pedidos.domain.entities;

import com.snackbar.kernel.domain.entities.BaseEntity;
import com.snackbar.kernel.domain.exceptions.ValidationException;
import lombok.Getter;

/**
 * Entidade de domínio para Motoboy.
 * Representa um entregador que pode ser atribuído a pedidos de delivery.
 */
@Getter
public class Motoboy extends BaseEntity {
    private String nome;
    private String telefone;
    private String veiculo;
    private String placa;
    private boolean ativo;

    private Motoboy() {
        super();
    }

    public static Motoboy criar(String nome, String telefone, String veiculo, String placa) {
        validarDados(nome, telefone);

        Motoboy motoboy = new Motoboy();
        motoboy.nome = nome.trim();
        motoboy.telefone = telefone.trim();
        motoboy.veiculo = veiculo != null ? veiculo.trim() : null;
        motoboy.placa = placa != null ? placa.trim().toUpperCase() : null;
        motoboy.ativo = true;
        motoboy.touch();
        return motoboy;
    }

    /**
     * Restaura um motoboy do banco de dados SEM validações.
     * Usado pelo mapper para reconstruir motoboys existentes.
     */
    public static Motoboy restaurarDoBanco(String nome, String telefone, String veiculo, String placa, boolean ativo) {
        Motoboy motoboy = new Motoboy();
        motoboy.nome = nome;
        motoboy.telefone = telefone;
        motoboy.veiculo = veiculo;
        motoboy.placa = placa;
        motoboy.ativo = ativo;
        return motoboy;
    }

    public void atualizarNome(String novoNome) {
        if (novoNome == null || novoNome.trim().isEmpty()) {
            throw new ValidationException("Nome do motoboy não pode ser nulo ou vazio");
        }
        this.nome = novoNome.trim();
        touch();
    }

    public void atualizarTelefone(String novoTelefone) {
        if (novoTelefone == null || novoTelefone.trim().isEmpty()) {
            throw new ValidationException("Telefone do motoboy não pode ser nulo ou vazio");
        }
        this.telefone = novoTelefone.trim();
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

    private static void validarDados(String nome, String telefone) {
        if (nome == null || nome.trim().isEmpty()) {
            throw new ValidationException("Nome do motoboy não pode ser nulo ou vazio");
        }
        if (telefone == null || telefone.trim().isEmpty()) {
            throw new ValidationException("Telefone do motoboy não pode ser nulo ou vazio");
        }
    }
}
