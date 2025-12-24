package com.sonecadelivery.pedidos.infrastructure.web;

import com.sonecadelivery.pedidos.application.dto.AtualizarLocalizacaoRequest;
import com.sonecadelivery.pedidos.application.dto.RastreamentoPedidoResponse;
import com.sonecadelivery.pedidos.application.ports.MotoboyJwtServicePort;
import com.sonecadelivery.pedidos.application.usecases.AtualizarLocalizacaoMotoboyUseCase;
import com.sonecadelivery.pedidos.application.usecases.ObterRastreamentoPedidoUseCase;
import com.sonecadelivery.pedidos.infrastructure.service.RastreamentoPedidoSSEService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;


/**
 * Controller REST para rastreamento de pedidos.
 * 
 * Endpoints:
 * - GET /api/cliente/pedidos/{id}/rastreamento - Obtém dados de rastreamento (cliente)
 * - GET /api/cliente/pedidos/{id}/rastreamento/stream - SSE stream para atualizações em tempo real (cliente)
 * - POST /api/motoboys/{motoboyId}/localizacao - Atualiza localização do motoboy
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Slf4j
public class RastreamentoPedidoController {
    
    private final ObterRastreamentoPedidoUseCase obterRastreamentoUseCase;
    private final AtualizarLocalizacaoMotoboyUseCase atualizarLocalizacaoUseCase;
    private final RastreamentoPedidoSSEService sseService;
    private final MotoboyJwtServicePort motoboyJwtService;
    
    /**
     * GET /api/cliente/pedidos/{pedidoId}/rastreamento
     * Obtém dados de rastreamento de um pedido.
     * Requer autenticação de cliente via header X-Cliente-Id.
     */
    @GetMapping("/cliente/pedidos/{pedidoId}/rastreamento")
    public ResponseEntity<RastreamentoPedidoResponse> obterRastreamento(
            @PathVariable String pedidoId,
            @RequestHeader("X-Cliente-Id") String clienteId) {
        
        log.debug("Buscando rastreamento do pedido {} para cliente {}", pedidoId, clienteId);
        
        RastreamentoPedidoResponse response = obterRastreamentoUseCase.executar(pedidoId, clienteId);
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * GET /api/cliente/pedidos/{pedidoId}/rastreamento/stream
     * SSE stream para receber atualizações de localização em tempo real.
     * Requer autenticação de cliente via header X-Cliente-Id.
     */
    @GetMapping(value = "/cliente/pedidos/{pedidoId}/rastreamento/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamRastreamento(
            @PathVariable String pedidoId,
            @RequestHeader("X-Cliente-Id") String clienteId) {
        
        log.info("Cliente {} conectando ao SSE de rastreamento do pedido {}", clienteId, pedidoId);
        
        // Valida que cliente pode rastrear (será validado no use case se necessário)
        // Por enquanto, apenas registra o SSE
        // TODO: Validar autorização antes de registrar SSE
        
        return sseService.registrar(pedidoId);
    }
    
    /**
     * POST /api/motoboys/{motoboyId}/localizacao
     * Endpoint para motoboy enviar localização.
     * Requer autenticação de motoboy via header X-Motoboy-Id e Authorization Bearer token.
     */
    @PostMapping("/motoboys/{motoboyId}/localizacao")
    public ResponseEntity<Void> atualizarLocalizacao(
            @PathVariable String motoboyId,
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestHeader(value = "X-Motoboy-Id", required = false) String motoboyIdHeader,
            @Valid @RequestBody AtualizarLocalizacaoRequest request) {
        
        // Valida token JWT
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            log.warn("Requisição sem token JWT válido");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        String token = authorization.substring(7);
        if (!motoboyJwtService.validarToken(token)) {
            log.warn("Token JWT inválido ou expirado");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        // Extrai motoboyId do token e valida com o path/header
        String motoboyIdDoToken = motoboyJwtService.extrairMotoboyId(token);
        String motoboyIdFinal = motoboyIdHeader != null && !motoboyIdHeader.isBlank() 
            ? motoboyIdHeader 
            : motoboyIdDoToken;
        
        if (!motoboyId.equals(motoboyIdFinal) || !motoboyIdDoToken.equals(motoboyIdFinal)) {
            log.warn("MotoboyId do path ({}) não corresponde ao autenticado ({})", 
                motoboyId, motoboyIdFinal);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        atualizarLocalizacaoUseCase.executar(motoboyId, request);
        
        return ResponseEntity.noContent().build();
    }
}

