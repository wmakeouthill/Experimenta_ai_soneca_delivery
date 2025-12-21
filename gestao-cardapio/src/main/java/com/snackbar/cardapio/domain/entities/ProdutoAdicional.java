package com.snackbar.cardapio.domain.entities;

import com.snackbar.kernel.domain.exceptions.ValidationException;
import lombok.Getter;

/**
 * Entidade que representa a associação entre um Produto e um Adicional.
 * Indica quais adicionais estão disponíveis para cada produto.
 */
@Getter
public class ProdutoAdicional {
    private String produtoId;
    private String adicionalId;

    private ProdutoAdicional() {
    }

    public static ProdutoAdicional criar(String produtoId, String adicionalId) {
        validarDados(produtoId, adicionalId);

        ProdutoAdicional pa = new ProdutoAdicional();
        pa.produtoId = produtoId;
        pa.adicionalId = adicionalId;
        return pa;
    }

    private static void validarDados(String produtoId, String adicionalId) {
        if (produtoId == null || produtoId.trim().isEmpty()) {
            throw new ValidationException("ID do produto não pode ser nulo ou vazio");
        }
        if (adicionalId == null || adicionalId.trim().isEmpty()) {
            throw new ValidationException("ID do adicional não pode ser nulo ou vazio");
        }
    }
}
