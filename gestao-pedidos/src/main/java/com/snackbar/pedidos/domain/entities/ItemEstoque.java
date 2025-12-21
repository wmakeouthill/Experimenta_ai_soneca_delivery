package com.snackbar.pedidos.domain.entities;

import com.snackbar.kernel.domain.entities.BaseEntity;
import com.snackbar.kernel.domain.exceptions.ValidationException;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entidade de domínio que representa um item de estoque.
 * Registra produtos/insumos do estoque da lanchonete.
 */
@Getter
public class ItemEstoque extends BaseEntity {
    private String nome;
    private String descricao;
    private BigDecimal quantidade;
    private BigDecimal quantidadeMinima;
    private UnidadeMedida unidadeMedida;
    private BigDecimal precoUnitario;
    private String fornecedor;
    private String codigoBarras;
    private boolean ativo;

    private ItemEstoque() {
        super();
        this.quantidade = BigDecimal.ZERO;
        this.quantidadeMinima = BigDecimal.ZERO;
        this.ativo = true;
    }

    /**
     * Cria um novo item de estoque.
     */
    public static ItemEstoque criar(
            String nome,
            String descricao,
            BigDecimal quantidade,
            BigDecimal quantidadeMinima,
            UnidadeMedida unidadeMedida,
            BigDecimal precoUnitario,
            String fornecedor,
            String codigoBarras
    ) {
        validarNome(nome);
        validarUnidadeMedida(unidadeMedida);

        ItemEstoque item = new ItemEstoque();
        item.nome = nome.trim();
        item.descricao = descricao;
        item.quantidade = quantidade != null ? quantidade : BigDecimal.ZERO;
        item.quantidadeMinima = quantidadeMinima != null ? quantidadeMinima : BigDecimal.ZERO;
        item.unidadeMedida = unidadeMedida;
        item.precoUnitario = precoUnitario;
        item.fornecedor = fornecedor;
        item.codigoBarras = codigoBarras;
        item.touch();
        return item;
    }

    /**
     * Atualiza os dados do item de estoque.
     */
    public void atualizar(
            String nome,
            String descricao,
            BigDecimal quantidade,
            BigDecimal quantidadeMinima,
            UnidadeMedida unidadeMedida,
            BigDecimal precoUnitario,
            String fornecedor,
            String codigoBarras
    ) {
        validarNome(nome);
        validarUnidadeMedida(unidadeMedida);

        this.nome = nome.trim();
        this.descricao = descricao;
        this.quantidade = quantidade != null ? quantidade : BigDecimal.ZERO;
        this.quantidadeMinima = quantidadeMinima != null ? quantidadeMinima : BigDecimal.ZERO;
        this.unidadeMedida = unidadeMedida;
        this.precoUnitario = precoUnitario;
        this.fornecedor = fornecedor;
        this.codigoBarras = codigoBarras;
        this.touch();
    }

    /**
     * Verifica se o item está com estoque baixo.
     */
    public boolean isEstoqueBaixo() {
        return this.quantidade.compareTo(this.quantidadeMinima) <= 0;
    }

    /**
     * Ativa o item.
     */
    public void ativar() {
        this.ativo = true;
        this.touch();
    }

    /**
     * Desativa o item.
     */
    public void desativar() {
        this.ativo = false;
        this.touch();
    }

    /**
     * Factory method para restaurar um item do banco de dados.
     */
    public static ItemEstoque restaurarDoBancoFactory(
            String id,
            String nome,
            String descricao,
            BigDecimal quantidade,
            BigDecimal quantidadeMinima,
            UnidadeMedida unidadeMedida,
            BigDecimal precoUnitario,
            String fornecedor,
            String codigoBarras,
            boolean ativo,
            LocalDateTime createdAt,
            LocalDateTime updatedAt
    ) {
        ItemEstoque item = new ItemEstoque();
        item.nome = nome;
        item.descricao = descricao;
        item.quantidade = quantidade;
        item.quantidadeMinima = quantidadeMinima;
        item.unidadeMedida = unidadeMedida;
        item.precoUnitario = precoUnitario;
        item.fornecedor = fornecedor;
        item.codigoBarras = codigoBarras;
        item.ativo = ativo;
        item.restaurarId(id);
        item.restaurarTimestamps(createdAt, updatedAt);
        return item;
    }

    private static void validarNome(String nome) {
        if (nome == null || nome.trim().isEmpty()) {
            throw new ValidationException("Nome do item não pode ser nulo ou vazio");
        }
    }

    private static void validarUnidadeMedida(UnidadeMedida unidadeMedida) {
        if (unidadeMedida == null) {
            throw new ValidationException("Unidade de medida não pode ser nula");
        }
    }
}

