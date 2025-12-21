package com.sonecadelivery.pedidos.domain.entities;

import com.sonecadelivery.cardapio.domain.valueobjects.Preco;
import com.sonecadelivery.kernel.domain.exceptions.ValidationException;
import lombok.Getter;

/**
 * Representa um adicional selecionado em um item do pedido.
 */
@Getter
public class ItemPedidoAdicional {
    private String adicionalId;
    private String adicionalNome;
    private int quantidade;
    private Preco precoUnitario;

    private ItemPedidoAdicional() {
    }

    public static ItemPedidoAdicional criar(String adicionalId, String adicionalNome, int quantidade,
            Preco precoUnitario) {
        validarDados(adicionalId, adicionalNome, quantidade, precoUnitario);

        ItemPedidoAdicional item = new ItemPedidoAdicional();
        item.adicionalId = adicionalId;
        item.adicionalNome = adicionalNome;
        item.quantidade = quantidade;
        item.precoUnitario = precoUnitario;
        return item;
    }

    /**
     * Calcula o subtotal deste adicional (preço * quantidade)
     */
    public Preco calcularSubtotal() {
        return precoUnitario.multiply(quantidade);
    }

    private static void validarDados(String adicionalId, String adicionalNome, int quantidade, Preco precoUnitario) {
        if (adicionalId == null || adicionalId.trim().isEmpty()) {
            throw new ValidationException("ID do adicional não pode ser nulo ou vazio");
        }
        if (adicionalNome == null || adicionalNome.trim().isEmpty()) {
            throw new ValidationException("Nome do adicional não pode ser nulo ou vazio");
        }
        if (quantidade <= 0) {
            throw new ValidationException("Quantidade do adicional deve ser maior que zero");
        }
        if (precoUnitario == null) {
            throw new ValidationException("Preço unitário do adicional não pode ser nulo");
        }
    }
}
