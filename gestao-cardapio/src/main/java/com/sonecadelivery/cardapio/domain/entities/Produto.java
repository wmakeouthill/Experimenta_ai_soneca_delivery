package com.sonecadelivery.cardapio.domain.entities;

import com.sonecadelivery.kernel.domain.entities.BaseEntity;
import com.sonecadelivery.cardapio.domain.valueobjects.Preco;
import com.sonecadelivery.kernel.domain.exceptions.ValidationException;
import lombok.Getter;

@Getter
public class Produto extends BaseEntity {
    private String nome;
    private String descricao;
    private Preco preco;
    private String categoria;
    private boolean disponivel;
    private String foto; // Base64 string da imagem
    
    private Produto() {
        super();
    }
    
    @SuppressWarnings("java:S1172") // descricao é usado na linha seguinte, é opcional e não precisa validação
    public static Produto criar(String nome, String descricao, Preco preco, String categoria, String foto) {
        validarDados(nome, categoria);
        
        Produto produto = new Produto();
        produto.nome = nome.trim();
        produto.descricao = descricao != null ? descricao.trim() : "";
        produto.preco = preco;
        produto.categoria = categoria.trim();
        produto.disponivel = true;
        produto.foto = foto != null && !foto.trim().isEmpty() ? foto.trim() : null;
        produto.touch();
        return produto;
    }
    
    public void atualizarPreco(Preco novoPreco) {
        if (novoPreco == null) {
            throw new ValidationException("Preço não pode ser nulo");
        }
        this.preco = novoPreco;
        touch();
    }
    
    public void marcarComoIndisponivel() {
        this.disponivel = false;
        touch();
    }
    
    public void marcarComoDisponivel() {
        this.disponivel = true;
        touch();
    }
    
    public void atualizarNome(String novoNome) {
        if (novoNome == null || novoNome.trim().isEmpty()) {
            throw new ValidationException("Nome do produto não pode ser nulo ou vazio");
        }
        this.nome = novoNome.trim();
        touch();
    }
    
    public void atualizarDescricao(String novaDescricao) {
        this.descricao = novaDescricao != null ? novaDescricao.trim() : "";
        touch();
    }
    
    public void atualizarCategoria(String novaCategoria) {
        if (novaCategoria == null || novaCategoria.trim().isEmpty()) {
            throw new ValidationException("Categoria não pode ser nula ou vazia");
        }
        this.categoria = novaCategoria.trim();
        touch();
    }
    
    public void atualizarFoto(String novaFoto) {
        this.foto = novaFoto != null && !novaFoto.trim().isEmpty() ? novaFoto.trim() : null;
        touch();
    }
    
    public boolean estaDisponivel() {
        return disponivel;
    }
    
    /**
     * Restaura o ID e timestamps do banco de dados (usado pelos mappers).
     * @param id ID a ser restaurado
     * @param createdAt Data de criação
     * @param updatedAt Data de atualização
     */
    public void restaurarDoBanco(String id, java.time.LocalDateTime createdAt, java.time.LocalDateTime updatedAt) {
        restaurarId(id);
        restaurarTimestamps(createdAt, updatedAt);
    }
    
    @SuppressWarnings("java:S1172") // descricao é usado no método criar, não precisa validação
    private static void validarDados(String nome, String categoria) {
        if (nome == null || nome.trim().isEmpty()) {
            throw new ValidationException("Nome do produto não pode ser nulo ou vazio");
        }
        if (categoria == null || categoria.trim().isEmpty()) {
            throw new ValidationException("Categoria não pode ser nula ou vazia");
        }
    }
}

