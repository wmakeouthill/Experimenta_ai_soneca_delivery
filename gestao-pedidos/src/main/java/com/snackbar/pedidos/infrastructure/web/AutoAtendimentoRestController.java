package com.snackbar.pedidos.infrastructure.web;

import com.snackbar.pedidos.infrastructure.idempotency.IdempotencyService;
import com.snackbar.kernel.security.JwtUserDetails;
import com.snackbar.pedidos.application.dto.CriarPedidoAutoAtendimentoRequest;
import com.snackbar.pedidos.application.dto.PedidoAutoAtendimentoResponse;
import com.snackbar.pedidos.application.usecases.CriarPedidoAutoAtendimentoUseCase;
import com.snackbar.pedidos.application.usecases.BuscarPedidoPorIdUseCase;
import com.snackbar.pedidos.application.dto.PedidoDTO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

/**
 * Controller REST para auto atendimento (totem).
 * 
 * IMPORTANTE: Este controller REQUER autenticação de operador.
 * O totem deve estar logado com um usuário operador para criar pedidos.
 * 
 * Diferente do PedidoMesaRestController (público), este:
 * - Requer autenticação JWT
 * - Cria pedidos diretamente (sem fila de pendentes)
 * - Não exige cliente cadastrado
 * 
 * Suporta idempotência via header X-Idempotency-Key para evitar
 * criação de pedidos duplicados.
 */
@RestController
@RequestMapping("/api/autoatendimento")
@RequiredArgsConstructor
@Slf4j
public class AutoAtendimentoRestController {

    private final CriarPedidoAutoAtendimentoUseCase criarPedidoUseCase;
    private final BuscarPedidoPorIdUseCase buscarPedidoUseCase;
    private final IdempotencyService idempotencyService;

    /**
     * Cria um pedido via auto atendimento (totem).
     * O pedido é criado diretamente no status PENDENTE.
     * 
     * Suporta idempotência via header X-Idempotency-Key para evitar
     * criação de pedidos duplicados em caso de retry.
     * 
     * @param request        Dados do pedido
     * @param idempotencyKey Chave de idempotência opcional
     * @return PedidoAutoAtendimentoResponse com dados do pedido criado
     */
    @PostMapping("/pedido")
    public ResponseEntity<PedidoAutoAtendimentoResponse> criarPedido(
            @Valid @RequestBody CriarPedidoAutoAtendimentoRequest request,
            @RequestHeader(value = "X-Idempotency-Key", required = false) String idempotencyKey) {

        // Obtém a autenticação do contexto de segurança
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        // Verifica se usuário está autenticado
        if (authentication == null || authentication.getPrincipal() == null
                || "anonymousUser".equals(authentication.getPrincipal())) {
            log.error("[AUTO-ATENDIMENTO] Tentativa de criar pedido sem autenticação");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        // Obtém email e ID do usuário do JWT
        String usuarioEmail;
        String usuarioId;

        Object principal = authentication.getPrincipal();
        if (principal instanceof JwtUserDetails) {
            JwtUserDetails userDetails = (JwtUserDetails) principal;
            usuarioEmail = userDetails.getEmail();
            usuarioId = userDetails.getId();
        } else {
            // Fallback para compatibilidade (não deveria acontecer)
            usuarioEmail = principal.toString();
            usuarioId = null;
            log.warn("[AUTO-ATENDIMENTO] Principal não é JwtUserDetails: {}", principal.getClass().getName());
        }

        log.info("[AUTO-ATENDIMENTO] Criando pedido - Operador: {} (ID: {}), Cliente: {}",
                usuarioEmail,
                usuarioId,
                request.getNomeCliente());

        // Se há chave de idempotência, usa o serviço
        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            final String finalUsuarioId = usuarioId;
            return idempotencyService.executeIdempotent(
                    idempotencyKey,
                    "POST /api/autoatendimento/pedido",
                    () -> criarPedidoUseCase.executar(request, finalUsuarioId),
                    PedidoAutoAtendimentoResponse.class);
        }

        PedidoAutoAtendimentoResponse response = criarPedidoUseCase.executar(request, usuarioId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Busca o status de um pedido de auto atendimento.
     * 
     * @param pedidoId ID do pedido
     * @return PedidoDTO com o status atual
     */
    @GetMapping("/pedido/{pedidoId}/status")
    public ResponseEntity<PedidoDTO> buscarStatus(@PathVariable String pedidoId) {
        PedidoDTO pedido = buscarPedidoUseCase.executar(pedidoId);
        return ResponseEntity.ok(pedido);
    }
}
