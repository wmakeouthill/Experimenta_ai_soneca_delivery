package com.snackbar.cardapio.domain.entities;

import com.snackbar.kernel.domain.entities.BaseEntity;
import com.snackbar.kernel.domain.exceptions.ValidationException;
import lombok.Getter;

@Getter
public class Categoria extends BaseEntity {
    private String nome;
    private String descricao;
    private boolean ativa;
    
    private Categoria() {
        super();
    }
    
    public static Categoria criar(String nome, String descricao) {
        if (nome == null || nome.trim().isEmpty()) {
            throw new ValidationException("Nome da categoria não pode ser nulo ou vazio");
        }
        
        Categoria categoria = new Categoria();
        categoria.nome = nome.trim();
        categoria.descricao = descricao != null ? descricao.trim() : "";
        categoria.ativa = true;
        categoria.touch();
        return categoria;
    }
    
    public void atualizarNome(String novoNome) {
        if (novoNome == null || novoNome.trim().isEmpty()) {
            throw new ValidationException("Nome da categoria não pode ser nulo ou vazio");
        }
        this.nome = novoNome.trim();
        touch();
    }
    
    public void atualizarDescricao(String novaDescricao) {
        this.descricao = novaDescricao != null ? novaDescricao.trim() : "";
        touch();
    }
    
    public void desativar() {
        this.ativa = false;
        touch();
    }
    
    public void ativar() {
        this.ativa = true;
        touch();
    }
    
    public boolean estaAtiva() {
        return ativa;
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
}

