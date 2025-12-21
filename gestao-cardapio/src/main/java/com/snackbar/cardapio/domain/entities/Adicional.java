package com.snackbar.cardapio.domain.entities;

import com.snackbar.kernel.domain.entities.BaseEntity;
import com.snackbar.cardapio.domain.valueobjects.Preco;
import com.snackbar.kernel.domain.exceptions.ValidationException;
import lombok.Getter;

/**
 * Entidade que representa um item adicional que pode ser vinculado a produtos.
 * Ex: Carne extra, Bacon, Onion Rings, etc.
 */
@Getter
public class Adicional extends BaseEntity {
    private String nome;
    private String descricao;
    private Preco preco;
    private String categoria; // Para agrupar: "Proteína", "Acompanhamento", "Molho", etc.
    private boolean disponivel;

    private Adicional() {
        super();
    }

    public static Adicional criar(String nome, String descricao, Preco preco, String categoria) {
        validarDados(nome, preco);

        Adicional adicional = new Adicional();
        adicional.nome = nome.trim();
        adicional.descricao = descricao != null ? descricao.trim() : "";
        adicional.preco = preco;
        adicional.categoria = categoria != null ? categoria.trim() : "";
        adicional.disponivel = true;
        adicional.touch();
        return adicional;
    }

    public void atualizarNome(String novoNome) {
        if (novoNome == null || novoNome.trim().isEmpty()) {
            throw new ValidationException("Nome do adicional não pode ser nulo ou vazio");
        }
        this.nome = novoNome.trim();
        touch();
    }

    public void atualizarDescricao(String novaDescricao) {
        this.descricao = novaDescricao != null ? novaDescricao.trim() : "";
        touch();
    }

    public void atualizarPreco(Preco novoPreco) {
        if (novoPreco == null) {
            throw new ValidationException("Preço não pode ser nulo");
        }
        this.preco = novoPreco;
        touch();
    }

    public void atualizarCategoria(String novaCategoria) {
        this.categoria = novaCategoria != null ? novaCategoria.trim() : "";
        touch();
    }

    public void marcarComoDisponivel() {
        this.disponivel = true;
        touch();
    }

    public void marcarComoIndisponivel() {
        this.disponivel = false;
        touch();
    }

    public boolean estaDisponivel() {
        return disponivel;
    }

    /**
     * Restaura o ID e timestamps do banco de dados (usado pelos mappers).
     */
    public void restaurarDoBanco(String id, java.time.LocalDateTime createdAt, java.time.LocalDateTime updatedAt) {
        restaurarId(id);
        restaurarTimestamps(createdAt, updatedAt);
    }

    private static void validarDados(String nome, Preco preco) {
        if (nome == null || nome.trim().isEmpty()) {
            throw new ValidationException("Nome do adicional não pode ser nulo ou vazio");
        }
        if (preco == null) {
            throw new ValidationException("Preço não pode ser nulo");
        }
    }
}
