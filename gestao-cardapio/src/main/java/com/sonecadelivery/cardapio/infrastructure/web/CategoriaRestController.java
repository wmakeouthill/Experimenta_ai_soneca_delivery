package com.sonecadelivery.cardapio.infrastructure.web;

import com.sonecadelivery.cardapio.application.dto.AtualizarCategoriaRequest;
import com.sonecadelivery.cardapio.application.dto.CategoriaDTO;
import com.sonecadelivery.cardapio.application.dto.CriarCategoriaRequest;
import com.sonecadelivery.cardapio.application.usecases.AtualizarCategoriaUseCase;
import com.sonecadelivery.cardapio.application.usecases.CriarCategoriaUseCase;
import com.sonecadelivery.cardapio.application.usecases.ExcluirCategoriaUseCase;
import com.sonecadelivery.cardapio.application.usecases.ListarCategoriasUseCase;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categorias")
@RequiredArgsConstructor
public class CategoriaRestController {
    
    private final CriarCategoriaUseCase criarCategoriaUseCase;
    private final ListarCategoriasUseCase listarCategoriasUseCase;
    private final AtualizarCategoriaUseCase atualizarCategoriaUseCase;
    private final ExcluirCategoriaUseCase excluirCategoriaUseCase;
    
    @PostMapping
    public ResponseEntity<CategoriaDTO> criar(@Valid @RequestBody CriarCategoriaRequest request) {
        CategoriaDTO categoria = criarCategoriaUseCase.executar(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(categoria);
    }
    
    @GetMapping
    public ResponseEntity<List<CategoriaDTO>> listar(
            @RequestParam(required = false) Boolean ativas) {
        List<CategoriaDTO> categorias;
        
        if (ativas != null && ativas) {
            categorias = listarCategoriasUseCase.executarAtivas();
        } else {
            categorias = listarCategoriasUseCase.executar();
        }
        
        return ResponseEntity.ok(categorias);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<CategoriaDTO> atualizar(
            @PathVariable String id,
            @Valid @RequestBody AtualizarCategoriaRequest request) {
        CategoriaDTO categoria = atualizarCategoriaUseCase.executar(id, request);
        return ResponseEntity.ok(categoria);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable String id) {
        excluirCategoriaUseCase.executar(id);
        return ResponseEntity.noContent().build();
    }
}

