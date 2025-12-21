package com.snackbar.pedidos.domain.entities;

import com.snackbar.cardapio.domain.valueobjects.Preco;
import com.snackbar.kernel.domain.exceptions.ValidationException;
import lombok.Getter;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Getter
public class ItemPedido {
    private String produtoId;
    private String produtoNome;
    private int quantidade;
    private Preco precoUnitario;
    private String observacoes;
    private List<ItemPedidoAdicional> adicionais;

    private ItemPedido() {
        this.adicionais = new ArrayList<>();
    }

    public static ItemPedido criar(String produtoId, String produtoNome, int quantidade, Preco precoUnitario,
            String observacoes) {
        return criar(produtoId, produtoNome, quantidade, precoUnitario, observacoes, null);
    }

    public static ItemPedido criar(String produtoId, String produtoNome, int quantidade, Preco precoUnitario,
            String observacoes, List<ItemPedidoAdicional> adicionais) {
        validarDados(produtoId, produtoNome, quantidade, precoUnitario);

        ItemPedido item = new ItemPedido();
        item.produtoId = produtoId;
        item.produtoNome = produtoNome;
        item.quantidade = quantidade;
        item.precoUnitario = precoUnitario;
        item.observacoes = observacoes != null ? observacoes.trim() : null;
        if (adicionais != null) {
            item.adicionais = new ArrayList<>(adicionais);
        }
        return item;
    }

    /**
     * Calcula o subtotal do item incluindo adicionais.
     * Fórmula: (precoUnitario + soma dos adicionais) * quantidade
     */
    public Preco calcularSubtotal() {
        Preco subtotalAdicionais = calcularSubtotalAdicionais();
        Preco precoComAdicionais = precoUnitario.add(subtotalAdicionais);
        return precoComAdicionais.multiply(quantidade);
    }

    /**
     * Calcula o subtotal apenas dos adicionais (por unidade do produto)
     */
    public Preco calcularSubtotalAdicionais() {
        if (adicionais == null || adicionais.isEmpty()) {
            return Preco.zero();
        }
        return adicionais.stream()
                .map(ItemPedidoAdicional::calcularSubtotal)
                .reduce(Preco.zero(), Preco::add);
    }

    /**
     * Retorna lista imutável de adicionais
     */
    public List<ItemPedidoAdicional> getAdicionais() {
        return Collections.unmodifiableList(adicionais);
    }

    /**
     * Adiciona um adicional ao item
     */
    public void adicionarAdicional(ItemPedidoAdicional adicional) {
        if (adicional == null) {
            throw new ValidationException("Adicional não pode ser nulo");
        }
        this.adicionais.add(adicional);
    }

    public void atualizarQuantidade(int novaQuantidade) {
        if (novaQuantidade <= 0) {
            throw new ValidationException("Quantidade deve ser maior que zero");
        }
        this.quantidade = novaQuantidade;
    }

    public void atualizarObservacoes(String novasObservacoes) {
        this.observacoes = novasObservacoes != null ? novasObservacoes.trim() : null;
    }

    private static void validarDados(String produtoId, String produtoNome, int quantidade, Preco precoUnitario) {
        if (produtoId == null || produtoId.trim().isEmpty()) {
            throw new ValidationException("ID do produto não pode ser nulo ou vazio");
        }
        if (produtoNome == null || produtoNome.trim().isEmpty()) {
            throw new ValidationException("Nome do produto não pode ser nulo ou vazio");
        }
        if (quantidade <= 0) {
            throw new ValidationException("Quantidade deve ser maior que zero");
        }
        if (precoUnitario == null) {
            throw new ValidationException("Preço unitário não pode ser nulo");
        }
    }
}
