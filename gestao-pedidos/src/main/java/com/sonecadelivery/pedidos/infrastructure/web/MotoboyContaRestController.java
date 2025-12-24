package com.sonecadelivery.pedidos.infrastructure.web;

import com.sonecadelivery.pedidos.application.dto.MotoboyDTO;
import com.sonecadelivery.pedidos.application.dto.PedidoDTO;
import com.sonecadelivery.pedidos.application.ports.MotoboyJwtServicePort;
import com.sonecadelivery.pedidos.application.usecases.GerenciarMotoboysUseCase;
import com.sonecadelivery.pedidos.application.usecases.ListarPedidosDoMotoboyUseCase;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Controller REST protegido para operações de conta do motoboy.
 * Endpoints que requerem autenticação JWT de motoboy.
 */
@RestController
@RequestMapping("/api/motoboy")
@RequiredArgsConstructor
@Slf4j
public class MotoboyContaRestController {

    private final GerenciarMotoboysUseCase gerenciarMotoboysUseCase;
    private final ListarPedidosDoMotoboyUseCase listarPedidosDoMotoboyUseCase;
    private final MotoboyJwtServicePort motoboyJwtService;

    /**
     * Obtém dados do motoboy logado.
     * GET /api/motoboy/me
     * O motoboyId virá do header X-Motoboy-Id
     */
    @GetMapping("/me")
    public ResponseEntity<?> me(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestHeader(value = "X-Motoboy-Id", required = false) String motoboyId) {
        
        // Validar token JWT
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            log.warn("Requisição sem token JWT válido");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Token JWT é obrigatório"));
        }
        
        String token = authorization.substring(7);
        if (!motoboyJwtService.validarToken(token)) {
            log.warn("Token JWT inválido ou expirado");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Token JWT inválido ou expirado"));
        }
        
        // Extrair motoboyId do token e validar com o header
        String motoboyIdDoToken = motoboyJwtService.extrairMotoboyId(token);
        if (motoboyId == null || motoboyId.isBlank()) {
            // Se não veio no header, usa do token
            motoboyId = motoboyIdDoToken;
            log.debug("MotoboyId obtido do token: {}", motoboyId);
        } else if (!motoboyId.equals(motoboyIdDoToken)) {
            log.warn("MotoboyId do header ({}) não corresponde ao do token ({})", motoboyId, motoboyIdDoToken);
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "MotoboyId do header não corresponde ao do token"));
        }

        try {
            MotoboyDTO motoboy = gerenciarMotoboysUseCase.buscarPorId(motoboyId);
            return ResponseEntity.ok(motoboy);
        } catch (com.sonecadelivery.kernel.domain.exceptions.NotFoundException e) {
            log.warn("Motoboy não encontrado: {}", motoboyId);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Motoboy não encontrado"));
        } catch (Exception e) {
            log.error("Erro ao buscar motoboy: {}", motoboyId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erro ao buscar motoboy: " + e.getMessage()));
        }
    }

    /**
     * Lista pedidos do motoboy logado.
     * GET /api/motoboy/pedidos
     * Retorna apenas pedidos com status PRONTO ou SAIU_PARA_ENTREGA atribuídos ao motoboy.
     */
    @GetMapping("/pedidos")
    public ResponseEntity<?> listarPedidos(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestHeader(value = "X-Motoboy-Id", required = false) String motoboyId) {
        log.debug("Recebida requisição para listar pedidos do motoboy. Header X-Motoboy-Id: {}", motoboyId);
        
        // Validar token JWT
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            log.warn("Requisição sem token JWT válido");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Token JWT é obrigatório"));
        }
        
        String token = authorization.substring(7);
        log.debug("Validando token JWT de motoboy. Token length: {}", token.length());
        
        if (!motoboyJwtService.validarToken(token)) {
            log.warn("Token JWT inválido ou expirado. Token (primeiros 20 chars): {}", 
                    token.length() > 20 ? token.substring(0, 20) + "..." : token);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Token JWT inválido ou expirado"));
        }
        
        log.debug("Token JWT de motoboy validado com sucesso");
        
        // Extrair motoboyId do token e validar com o header
        String motoboyIdDoToken = motoboyJwtService.extrairMotoboyId(token);
        if (motoboyId == null || motoboyId.isBlank()) {
            // Se não veio no header, usa do token
            motoboyId = motoboyIdDoToken;
            log.debug("MotoboyId obtido do token: {}", motoboyId);
        } else if (!motoboyId.equals(motoboyIdDoToken)) {
            log.warn("MotoboyId do header ({}) não corresponde ao do token ({})", motoboyId, motoboyIdDoToken);
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "MotoboyId do header não corresponde ao do token"));
        }

        try {
            log.debug("Executando use case para listar pedidos do motoboy: {}", motoboyId);
            List<PedidoDTO> pedidos = listarPedidosDoMotoboyUseCase.executar(motoboyId);
            log.debug("Use case executado com sucesso. Total de pedidos: {}", pedidos.size());
            
            // Log detalhado para debug
            if (log.isDebugEnabled()) {
                for (PedidoDTO pedido : pedidos) {
                    log.debug("Pedido {} - Status: {}, Itens: {}, MeiosPagamento: {}", 
                            pedido.getId(), pedido.getStatus(), 
                            pedido.getItens() != null ? pedido.getItens().size() : 0,
                            pedido.getMeiosPagamento() != null ? pedido.getMeiosPagamento().size() : 0);
                }
            }
            
            return ResponseEntity.ok(pedidos);
        } catch (com.sonecadelivery.kernel.domain.exceptions.NotFoundException e) {
            log.warn("Motoboy não encontrado: {}", motoboyId);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Motoboy não encontrado"));
        } catch (Exception e) {
            log.error("Erro ao listar pedidos do motoboy: {}", motoboyId, e);
            // Log do stack trace completo para debug
            if (log.isDebugEnabled()) {
                log.debug("Stack trace completo:", e);
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "error", "Erro ao listar pedidos: " + e.getMessage(),
                            "type", e.getClass().getSimpleName(),
                            "message", e.getMessage() != null ? e.getMessage() : "Erro desconhecido"
                    ));
        }
    }
}

