package com.snackbar.pedidos.infrastructure.web;

import com.snackbar.pedidos.application.dto.AtualizarMesaRequest;
import com.snackbar.pedidos.application.dto.CriarMesaRequest;
import com.snackbar.pedidos.application.dto.MesaDTO;
import com.snackbar.pedidos.application.usecases.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.NonNull;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller REST para gerenciamento de mesas.
 * A segurança é configurada no SecurityConfig do sistema-orquestrador.
 */
@RestController
@RequestMapping("/api/mesas")
@RequiredArgsConstructor
public class MesaRestController {

    private final CriarMesaUseCase criarMesaUseCase;
    private final ListarMesasUseCase listarMesasUseCase;
    private final BuscarMesaPorIdUseCase buscarMesaPorIdUseCase;
    private final BuscarMesaPorTokenUseCase buscarMesaPorTokenUseCase;
    private final AtualizarMesaUseCase atualizarMesaUseCase;
    private final ExcluirMesaUseCase excluirMesaUseCase;

    @PostMapping
    public ResponseEntity<MesaDTO> criar(@Valid @RequestBody CriarMesaRequest request) {
        MesaDTO mesa = criarMesaUseCase.executar(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(mesa);
    }

    @GetMapping
    public ResponseEntity<List<MesaDTO>> listar(@RequestParam(name = "ativas", required = false) Boolean ativas) {
        List<MesaDTO> mesas = Boolean.TRUE.equals(ativas)
                ? listarMesasUseCase.executarAtivas()
                : listarMesasUseCase.executar();
        return ResponseEntity.ok(mesas);
    }

    @GetMapping("/{id}")
    public ResponseEntity<MesaDTO> buscarPorId(@NonNull @PathVariable String id) {
        MesaDTO mesa = buscarMesaPorIdUseCase.executar(id);
        return ResponseEntity.ok(mesa);
    }

    @GetMapping("/token/{token}")
    public ResponseEntity<MesaDTO> buscarPorToken(@NonNull @PathVariable String token) {
        // Endpoint público para validar QR code
        MesaDTO mesa = buscarMesaPorTokenUseCase.executar(token);
        return ResponseEntity.ok(mesa);
    }

    @PutMapping("/{id}")
    public ResponseEntity<MesaDTO> atualizar(
            @NonNull @PathVariable String id,
            @Valid @RequestBody AtualizarMesaRequest request) {
        MesaDTO mesa = atualizarMesaUseCase.executar(id, request);
        return ResponseEntity.ok(mesa);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@NonNull @PathVariable String id) {
        excluirMesaUseCase.executar(id);
        return ResponseEntity.noContent().build();
    }
}
