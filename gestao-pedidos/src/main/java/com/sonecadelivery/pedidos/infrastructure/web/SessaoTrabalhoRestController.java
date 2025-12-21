package com.sonecadelivery.pedidos.infrastructure.web;

import com.sonecadelivery.pedidos.application.dto.FinalizarSessaoRequest;
import com.sonecadelivery.pedidos.application.dto.IniciarSessaoRequest;
import com.sonecadelivery.pedidos.application.dto.SessaoTrabalhoDTO;
import com.sonecadelivery.pedidos.application.usecases.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.NonNull;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/sessoes-trabalho")
@RequiredArgsConstructor
public class SessaoTrabalhoRestController {

    private final IniciarSessaoTrabalhoUseCase iniciarSessaoUseCase;
    private final PausarSessaoTrabalhoUseCase pausarSessaoUseCase;
    private final RetomarSessaoTrabalhoUseCase retomarSessaoUseCase;
    private final FinalizarSessaoTrabalhoUseCase finalizarSessaoUseCase;
    private final BuscarSessaoAtivaUseCase buscarSessaoAtivaUseCase;
    private final ListarSessoesTrabalhoUseCase listarSessoesUseCase;

    @PostMapping
    public ResponseEntity<SessaoTrabalhoDTO> iniciar(@Valid @RequestBody IniciarSessaoRequest request) {
        SessaoTrabalhoDTO sessao = iniciarSessaoUseCase.executar(
                request.getUsuarioId(),
                request.getValorAbertura());
        return ResponseEntity.status(HttpStatus.CREATED).body(sessao);
    }

    @PutMapping("/{id}/pausar")
    public ResponseEntity<SessaoTrabalhoDTO> pausar(@NonNull @PathVariable String id) {
        SessaoTrabalhoDTO sessao = pausarSessaoUseCase.executar(id);
        return ResponseEntity.ok(sessao);
    }

    @PutMapping("/{id}/retomar")
    public ResponseEntity<SessaoTrabalhoDTO> retomar(@NonNull @PathVariable String id) {
        SessaoTrabalhoDTO sessao = retomarSessaoUseCase.executar(id);
        return ResponseEntity.ok(sessao);
    }

    @SuppressWarnings("null") // @Valid garante que valorFechamento não é null
    @PutMapping("/{id}/finalizar")
    public ResponseEntity<SessaoTrabalhoDTO> finalizar(
            @NonNull @PathVariable String id,
            @Valid @RequestBody FinalizarSessaoRequest request) {
        SessaoTrabalhoDTO sessao = finalizarSessaoUseCase.executar(id, request.getValorFechamento());
        return ResponseEntity.ok(sessao);
    }

    @GetMapping("/ativa")
    public ResponseEntity<SessaoTrabalhoDTO> buscarAtiva() {
        Optional<SessaoTrabalhoDTO> sessao = buscarSessaoAtivaUseCase.executar();
        return sessao.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping
    public ResponseEntity<List<SessaoTrabalhoDTO>> listar(
            @RequestParam(name = "dataInicio", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataInicio) {
        List<SessaoTrabalhoDTO> sessoes = listarSessoesUseCase.executar(dataInicio);
        return ResponseEntity.ok(sessoes);
    }
}
