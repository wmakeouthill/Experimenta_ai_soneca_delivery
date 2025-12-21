package com.sonecadelivery.orquestrador.infrastructure.web;

import com.sonecadelivery.orquestrador.application.dto.ConfigAnimacaoDTO;
import com.sonecadelivery.orquestrador.application.dto.SalvarConfigAnimacaoRequest;
import com.sonecadelivery.orquestrador.application.usecases.CarregarConfigAnimacaoUseCase;
import com.sonecadelivery.orquestrador.application.usecases.SalvarConfigAnimacaoUseCase;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/config-animacao")
@RequiredArgsConstructor
public class ConfigAnimacaoRestController {
    
    private final CarregarConfigAnimacaoUseCase carregarUseCase;
    private final SalvarConfigAnimacaoUseCase salvarUseCase;
    
    @GetMapping
    public ResponseEntity<ConfigAnimacaoDTO> carregar() {
        ConfigAnimacaoDTO config = carregarUseCase.executar();
        return ResponseEntity.ok(config);
    }
    
    @PostMapping
    public ResponseEntity<ConfigAnimacaoDTO> salvar(@Valid @RequestBody SalvarConfigAnimacaoRequest request) {
        ConfigAnimacaoDTO config = salvarUseCase.executar(request);
        return ResponseEntity.ok(config);
    }
}

