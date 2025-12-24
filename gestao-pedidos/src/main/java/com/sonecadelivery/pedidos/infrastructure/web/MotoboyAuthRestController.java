package com.sonecadelivery.pedidos.infrastructure.web;

import com.sonecadelivery.pedidos.application.dto.MotoboyGoogleLoginRequest;
import com.sonecadelivery.pedidos.application.dto.MotoboyLoginResponse;
import com.sonecadelivery.pedidos.application.usecases.AutenticarMotoboyGoogleUseCase;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controller REST público para autenticação de motoboys.
 * Endpoints públicos (sem autenticação) para login/cadastro.
 */
@RestController
@RequestMapping("/api/publico/motoboy/auth")
@RequiredArgsConstructor
public class MotoboyAuthRestController {

    private final AutenticarMotoboyGoogleUseCase autenticarMotoboyGoogleUseCase;

    /**
     * Login/Cadastro via Google OAuth.
     * POST /api/publico/motoboy/auth/google
     */
    @PostMapping("/google")
    public ResponseEntity<MotoboyLoginResponse> loginGoogle(
            @Valid @RequestBody MotoboyGoogleLoginRequest request) {
        MotoboyLoginResponse response = autenticarMotoboyGoogleUseCase.executar(request);
        return ResponseEntity.ok(response);
    }
}

