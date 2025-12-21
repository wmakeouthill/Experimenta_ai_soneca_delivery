package com.sonecadelivery.cardapio.infrastructure.web;

import com.sonecadelivery.cardapio.application.dto.AdicionalDTO;
import com.sonecadelivery.cardapio.application.usecases.GerenciarAdicionaisProdutoUseCase;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller para gerenciar os adicionais vinculados a um produto.
 */
@RestController
@RequestMapping("/api/produtos/{produtoId}/adicionais")
@RequiredArgsConstructor
public class ProdutoAdicionalRestController {

    private final GerenciarAdicionaisProdutoUseCase gerenciarAdicionaisProdutoUseCase;

    /**
     * Lista todos os adicionais vinculados a um produto.
     */
    @GetMapping
    public ResponseEntity<List<AdicionalDTO>> listarAdicionaisDoProduto(@PathVariable String produtoId) {
        List<AdicionalDTO> adicionais = gerenciarAdicionaisProdutoUseCase.buscarAdicionaisDoProduto(produtoId);
        return ResponseEntity.ok(adicionais);
    }

    /**
     * Atualiza os adicionais vinculados a um produto (substitui todos).
     * Recebe uma lista de IDs de adicionais.
     */
    @PutMapping
    public ResponseEntity<Void> atualizarAdicionaisDoProduto(
            @PathVariable String produtoId,
            @RequestBody List<String> adicionalIds) {
        gerenciarAdicionaisProdutoUseCase.atualizarAdicionaisDoProduto(produtoId, adicionalIds);
        return ResponseEntity.ok().build();
    }

    /**
     * Vincula um adicional a um produto.
     */
    @PostMapping("/{adicionalId}")
    public ResponseEntity<Void> vincularAdicional(
            @PathVariable String produtoId,
            @PathVariable String adicionalId) {
        gerenciarAdicionaisProdutoUseCase.vincularAdicional(produtoId, adicionalId);
        return ResponseEntity.ok().build();
    }

    /**
     * Remove o vínculo de um adicional de um produto.
     */
    @DeleteMapping("/{adicionalId}")
    public ResponseEntity<Void> desvincularAdicional(
            @PathVariable String produtoId,
            @PathVariable String adicionalId) {
        gerenciarAdicionaisProdutoUseCase.desvincularAdicional(produtoId, adicionalId);
        return ResponseEntity.noContent().build();
    }
}
