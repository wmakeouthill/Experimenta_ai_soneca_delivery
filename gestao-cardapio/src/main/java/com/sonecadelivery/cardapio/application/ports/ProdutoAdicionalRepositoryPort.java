package com.sonecadelivery.cardapio.application.ports;

import com.sonecadelivery.cardapio.domain.entities.Adicional;
import org.springframework.lang.NonNull;

import java.util.List;

/**
 * Port para gerenciar a associação entre produtos e adicionais.
 */
public interface ProdutoAdicionalRepositoryPort {

    /**
     * Vincula um adicional a um produto.
     */
    void vincular(@NonNull String produtoId, @NonNull String adicionalId);

    /**
     * Remove o vínculo entre um produto e um adicional.
     */
    void desvincular(@NonNull String produtoId, @NonNull String adicionalId);

    /**
     * Remove todos os vínculos de um produto.
     */
    void desvincularTodosDoProduto(@NonNull String produtoId);

    /**
     * Busca todos os adicionais vinculados a um produto.
     */
    List<Adicional> buscarAdicionaisDoProduto(@NonNull String produtoId);

    /**
     * Busca os IDs dos adicionais vinculados a um produto.
     */
    List<String> buscarIdsAdicionaisDoProduto(@NonNull String produtoId);

    /**
     * Verifica se um adicional está vinculado a um produto.
     */
    boolean existeVinculo(@NonNull String produtoId, @NonNull String adicionalId);

    /**
     * Atualiza os vínculos de um produto (remove existentes e adiciona novos).
     */
    void atualizarVinculos(@NonNull String produtoId, @NonNull List<String> adicionalIds);
}
