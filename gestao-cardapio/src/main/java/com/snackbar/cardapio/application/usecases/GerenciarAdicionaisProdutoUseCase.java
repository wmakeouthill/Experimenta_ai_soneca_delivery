package com.snackbar.cardapio.application.usecases;

import com.snackbar.cardapio.application.dto.AdicionalDTO;
import com.snackbar.cardapio.application.ports.ProdutoAdicionalRepositoryPort;
import com.snackbar.cardapio.application.ports.ProdutoRepositoryPort;
import com.snackbar.cardapio.domain.entities.Adicional;
import com.snackbar.kernel.domain.exceptions.ValidationException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class GerenciarAdicionaisProdutoUseCase {

    private final ProdutoRepositoryPort produtoRepository;
    private final ProdutoAdicionalRepositoryPort produtoAdicionalRepository;

    /**
     * Busca todos os adicionais vinculados a um produto.
     */
    public List<AdicionalDTO> buscarAdicionaisDoProduto(String produtoId) {
        validarProdutoExiste(produtoId);

        List<Adicional> adicionais = produtoAdicionalRepository.buscarAdicionaisDoProduto(produtoId);
        return adicionais.stream()
                .map(AdicionalDTO::de)
                .toList();
    }

    /**
     * Busca apenas os IDs dos adicionais vinculados a um produto.
     */
    public List<String> buscarIdsAdicionaisDoProduto(String produtoId) {
        validarProdutoExiste(produtoId);
        return produtoAdicionalRepository.buscarIdsAdicionaisDoProduto(produtoId);
    }

    /**
     * Atualiza os adicionais vinculados a um produto (substitui todos).
     */
    public void atualizarAdicionaisDoProduto(String produtoId, List<String> adicionalIds) {
        validarProdutoExiste(produtoId);
        produtoAdicionalRepository.atualizarVinculos(produtoId, adicionalIds != null ? adicionalIds : List.of());
    }

    /**
     * Vincula um adicional a um produto.
     */
    public void vincularAdicional(String produtoId, String adicionalId) {
        validarProdutoExiste(produtoId);
        produtoAdicionalRepository.vincular(produtoId, adicionalId);
    }

    /**
     * Remove o vínculo de um adicional de um produto.
     */
    public void desvincularAdicional(String produtoId, String adicionalId) {
        validarProdutoExiste(produtoId);
        produtoAdicionalRepository.desvincular(produtoId, adicionalId);
    }

    private void validarProdutoExiste(String produtoId) {
        if (!produtoRepository.existePorId(produtoId)) {
            throw new ValidationException("Produto não encontrado com ID: " + produtoId);
        }
    }
}
