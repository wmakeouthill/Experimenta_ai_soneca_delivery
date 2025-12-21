package com.snackbar.cardapio.infrastructure.web;

import com.snackbar.cardapio.application.dto.AtualizarProdutoRequest;
import com.snackbar.cardapio.application.dto.CriarProdutoRequest;
import com.snackbar.cardapio.application.dto.ProdutoDTO;
import com.snackbar.cardapio.application.usecases.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/produtos")
@RequiredArgsConstructor
public class ProdutoRestController {
    
    private final CriarProdutoUseCase criarProdutoUseCase;
    private final ListarProdutosUseCase listarProdutosUseCase;
    private final BuscarProdutoPorIdUseCase buscarProdutoPorIdUseCase;
    private final AtualizarProdutoUseCase atualizarProdutoUseCase;
    private final ExcluirProdutoUseCase excluirProdutoUseCase;
    
    @PostMapping
    public ResponseEntity<ProdutoDTO> criar(@Valid @RequestBody CriarProdutoRequest request) {
        ProdutoDTO produto = criarProdutoUseCase.executar(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(produto);
    }
    
    @GetMapping
    public ResponseEntity<List<ProdutoDTO>> listar(
            @RequestParam(name = "categoria", required = false) String categoria,
            @RequestParam(name = "disponivel", required = false) Boolean disponivel) {
        List<ProdutoDTO> produtos;
        
        if (categoria != null) {
            produtos = listarProdutosUseCase.executarPorCategoria(categoria);
        } else if (disponivel != null && disponivel) {
            produtos = listarProdutosUseCase.executarDisponiveis();
        } else {
            produtos = listarProdutosUseCase.executar();
        }
        
        return ResponseEntity.ok(produtos);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ProdutoDTO> buscarPorId(@PathVariable String id) {
        ProdutoDTO produto = buscarProdutoPorIdUseCase.executar(id);
        return ResponseEntity.ok(produto);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<ProdutoDTO> atualizar(
            @PathVariable String id,
            @Valid @RequestBody AtualizarProdutoRequest request) {
        ProdutoDTO produto = atualizarProdutoUseCase.executar(id, request);
        return ResponseEntity.ok(produto);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable String id) {
        excluirProdutoUseCase.executar(id);
        return ResponseEntity.noContent().build();
    }
}

