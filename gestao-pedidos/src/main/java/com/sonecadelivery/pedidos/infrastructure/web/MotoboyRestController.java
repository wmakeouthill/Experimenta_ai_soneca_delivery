package com.sonecadelivery.pedidos.infrastructure.web;

import com.sonecadelivery.pedidos.application.dto.AtualizarMotoboyRequest;
import com.sonecadelivery.pedidos.application.dto.CriarMotoboyRequest;
import com.sonecadelivery.pedidos.application.dto.MotoboyDTO;
import com.sonecadelivery.pedidos.application.usecases.GerenciarMotoboysUseCase;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller REST para gerenciamento de motoboys.
 * Acesso restrito a administradores.
 */
@RestController
@RequestMapping("/api/motoboys")
@RequiredArgsConstructor
public class MotoboyRestController {

    private final GerenciarMotoboysUseCase gerenciarMotoboysUseCase;

    /**
     * Lista todos os motoboys.
     * GET /api/motoboys
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERADOR')")
    public ResponseEntity<List<MotoboyDTO>> listar(
            @RequestParam(required = false, defaultValue = "false") boolean apenasAtivos) {
        List<MotoboyDTO> motoboys = apenasAtivos
                ? gerenciarMotoboysUseCase.listarAtivos()
                : gerenciarMotoboysUseCase.listarTodos();
        return ResponseEntity.ok(motoboys);
    }

    /**
     * Busca motoboy por ID.
     * GET /api/motoboys/{id}
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERADOR')")
    public ResponseEntity<MotoboyDTO> buscarPorId(@PathVariable String id) {
        MotoboyDTO motoboy = gerenciarMotoboysUseCase.buscarPorId(id);
        return ResponseEntity.ok(motoboy);
    }

    /**
     * Cria um novo motoboy.
     * POST /api/motoboys
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MotoboyDTO> criar(@Valid @RequestBody CriarMotoboyRequest request) {
        MotoboyDTO motoboy = gerenciarMotoboysUseCase.criar(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(motoboy);
    }

    /**
     * Atualiza um motoboy existente.
     * PUT /api/motoboys/{id}
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MotoboyDTO> atualizar(
            @PathVariable String id,
            @Valid @RequestBody AtualizarMotoboyRequest request) {
        MotoboyDTO motoboy = gerenciarMotoboysUseCase.atualizar(id, request);
        return ResponseEntity.ok(motoboy);
    }

    /**
     * Ativa um motoboy.
     * PUT /api/motoboys/{id}/ativar
     */
    @PutMapping("/{id}/ativar")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MotoboyDTO> ativar(@PathVariable String id) {
        MotoboyDTO motoboy = gerenciarMotoboysUseCase.ativar(id);
        return ResponseEntity.ok(motoboy);
    }

    /**
     * Desativa um motoboy.
     * PUT /api/motoboys/{id}/desativar
     */
    @PutMapping("/{id}/desativar")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MotoboyDTO> desativar(@PathVariable String id) {
        MotoboyDTO motoboy = gerenciarMotoboysUseCase.desativar(id);
        return ResponseEntity.ok(motoboy);
    }

    /**
     * Exclui um motoboy.
     * DELETE /api/motoboys/{id}
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> excluir(@PathVariable String id) {
        gerenciarMotoboysUseCase.excluir(id);
        return ResponseEntity.noContent().build();
    }
}
