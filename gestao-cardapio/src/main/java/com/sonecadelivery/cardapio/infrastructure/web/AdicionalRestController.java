package com.sonecadelivery.cardapio.infrastructure.web;

import com.sonecadelivery.cardapio.application.dto.AtualizarAdicionalRequest;
import com.sonecadelivery.cardapio.application.dto.CriarAdicionalRequest;
import com.sonecadelivery.cardapio.application.dto.AdicionalDTO;
import com.sonecadelivery.cardapio.application.usecases.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/adicionais")
@RequiredArgsConstructor
public class AdicionalRestController {

    private final CriarAdicionalUseCase criarAdicionalUseCase;
    private final ListarAdicionaisUseCase listarAdicionaisUseCase;
    private final BuscarAdicionalPorIdUseCase buscarAdicionalPorIdUseCase;
    private final AtualizarAdicionalUseCase atualizarAdicionalUseCase;
    private final ExcluirAdicionalUseCase excluirAdicionalUseCase;

    @PostMapping
    public ResponseEntity<AdicionalDTO> criar(@Valid @RequestBody CriarAdicionalRequest request) {
        AdicionalDTO adicional = criarAdicionalUseCase.executar(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(adicional);
    }

    @GetMapping
    public ResponseEntity<List<AdicionalDTO>> listar(
            @RequestParam(name = "categoria", required = false) String categoria,
            @RequestParam(name = "disponivel", required = false) Boolean disponivel) {
        List<AdicionalDTO> adicionais;

        if (categoria != null) {
            adicionais = listarAdicionaisUseCase.executarPorCategoria(categoria);
        } else {
            boolean apenasDisponiveis = disponivel != null && disponivel;
            adicionais = listarAdicionaisUseCase.executar(apenasDisponiveis);
        }

        return ResponseEntity.ok(adicionais);
    }

    @GetMapping("/{id}")
    public ResponseEntity<AdicionalDTO> buscarPorId(@PathVariable String id) {
        AdicionalDTO adicional = buscarAdicionalPorIdUseCase.executar(id);
        return ResponseEntity.ok(adicional);
    }

    @PutMapping("/{id}")
    public ResponseEntity<AdicionalDTO> atualizar(
            @PathVariable String id,
            @Valid @RequestBody AtualizarAdicionalRequest request) {
        AdicionalDTO adicional = atualizarAdicionalUseCase.executar(id, request);
        return ResponseEntity.ok(adicional);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable String id) {
        excluirAdicionalUseCase.executar(id);
        return ResponseEntity.noContent().build();
    }
}
