package com.sonecadelivery.pedidos.infrastructure.web;

import com.sonecadelivery.pedidos.application.dto.AtualizarItemEstoqueRequest;
import com.sonecadelivery.pedidos.application.dto.CriarItemEstoqueRequest;
import com.sonecadelivery.pedidos.application.dto.ItemEstoqueDTO;
import com.sonecadelivery.pedidos.application.usecases.AtualizarItemEstoqueUseCase;
import com.sonecadelivery.pedidos.application.usecases.CriarItemEstoqueUseCase;
import com.sonecadelivery.pedidos.application.usecases.ExcluirItemEstoqueUseCase;
import com.sonecadelivery.pedidos.application.usecases.ListarItensEstoqueUseCase;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.NonNull;
import org.springframework.web.bind.annotation.*;

/**
 * Controller REST para gestão de estoque.
 */
@RestController
@RequestMapping("/api/estoque")
@RequiredArgsConstructor
public class GestaoEstoqueRestController {
    
    private final CriarItemEstoqueUseCase criarItemUseCase;
    private final ListarItensEstoqueUseCase listarItensUseCase;
    private final AtualizarItemEstoqueUseCase atualizarItemUseCase;
    private final ExcluirItemEstoqueUseCase excluirItemUseCase;
    
    /**
     * Lista todos os itens de estoque com paginação.
     */
    @GetMapping
    public ResponseEntity<Page<ItemEstoqueDTO>> listarItens(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "nome") String sort,
            @RequestParam(defaultValue = "asc") String direction,
            @RequestParam(required = false) String filtro,
            @RequestParam(required = false) Boolean apenasAtivos) {
        
        Sort.Direction sortDirection = "desc".equalsIgnoreCase(direction) 
                ? Sort.Direction.DESC 
                : Sort.Direction.ASC;
        
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sort));
        
        Page<ItemEstoqueDTO> resultado;
        
        if (filtro != null && !filtro.isBlank()) {
            resultado = listarItensUseCase.buscarPorNome(filtro, pageable);
        } else if (Boolean.TRUE.equals(apenasAtivos)) {
            resultado = listarItensUseCase.listarAtivos(pageable);
        } else {
            resultado = listarItensUseCase.executar(pageable);
        }
        
        return ResponseEntity.ok(resultado);
    }
    
    /**
     * Cria um novo item de estoque.
     */
    @PostMapping
    public ResponseEntity<ItemEstoqueDTO> criarItem(
            @Valid @RequestBody CriarItemEstoqueRequest request) {
        ItemEstoqueDTO item = criarItemUseCase.executar(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(item);
    }
    
    /**
     * Atualiza um item de estoque existente.
     */
    @PutMapping("/{id}")
    public ResponseEntity<ItemEstoqueDTO> atualizarItem(
            @NonNull @PathVariable String id,
            @Valid @RequestBody AtualizarItemEstoqueRequest request) {
        ItemEstoqueDTO item = atualizarItemUseCase.executar(id, request);
        return ResponseEntity.ok(item);
    }
    
    /**
     * Exclui um item de estoque.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluirItem(@NonNull @PathVariable String id) {
        excluirItemUseCase.executar(id);
        return ResponseEntity.noContent().build();
    }
}

