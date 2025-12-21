package com.snackbar.autenticacao.infrastructure.web;

import com.snackbar.autenticacao.application.dtos.LoginRequest;
import com.snackbar.autenticacao.application.dtos.LoginResponse;
import com.snackbar.autenticacao.application.usecases.AutenticarUsuarioUseCase;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthRestController {
    
    private final AutenticarUsuarioUseCase autenticarUsuarioUseCase;
    
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = autenticarUsuarioUseCase.executar(request);
        return ResponseEntity.ok(response);
    }
}

