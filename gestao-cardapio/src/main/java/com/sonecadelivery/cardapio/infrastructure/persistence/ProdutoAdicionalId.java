package com.sonecadelivery.cardapio.infrastructure.persistence;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * Classe de ID composto para ProdutoAdicionalEntity.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProdutoAdicionalId implements Serializable {
    private String produtoId;
    private String adicionalId;
}
