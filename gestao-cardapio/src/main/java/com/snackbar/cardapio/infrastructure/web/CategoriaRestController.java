package com.snackbar.cardapio.infrastructure.web;

import com.snackbar.cardapio.application.dto.CategoriaDTO;
import com.snackbar.cardapio.application.dto.CriarCategoriaRequest;
import com.snackbar.cardapio.application.usecases.CriarCategoriaUseCase;
import com.snackbar.cardapio.application.usecases.ListarCategoriasUseCase;
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
}

