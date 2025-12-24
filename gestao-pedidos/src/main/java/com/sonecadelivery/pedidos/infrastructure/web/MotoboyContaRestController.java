package com.sonecadelivery.pedidos.infrastructure.web;

import com.sonecadelivery.pedidos.application.dto.MotoboyDTO;
import com.sonecadelivery.pedidos.application.dto.PedidoDTO;
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

    /**
     * Obtém dados do motoboy logado.
     * GET /api/motoboy/me
     * O motoboyId virá do header X-Motoboy-Id
     */
    @GetMapping("/me")
    public ResponseEntity<?> me(@RequestHeader(value = "X-Motoboy-Id", required = false) String motoboyId) {
        if (motoboyId == null || motoboyId.isBlank()) {
            log.warn("Requisição sem header X-Motoboy-Id");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Header X-Motoboy-Id é obrigatório"));
        }

        try {
            MotoboyDTO motoboy = gerenciarMotoboysUseCase.buscarPorId(motoboyId);
            return ResponseEntity.ok(motoboy);
        } catch (Exception e) {
            log.error("Erro ao buscar motoboy: {}", motoboyId, e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Motoboy não encontrado"));
        }
    }

    /**
     * Lista pedidos do motoboy logado.
     * GET /api/motoboy/pedidos
     * Retorna apenas pedidos com status PRONTO ou SAIU_PARA_ENTREGA atribuídos ao motoboy.
     */
    @GetMapping("/pedidos")
    public ResponseEntity<?> listarPedidos(@RequestHeader(value = "X-Motoboy-Id", required = false) String motoboyId) {
        log.debug("Recebida requisição para listar pedidos do motoboy. Header X-Motoboy-Id: {}", motoboyId);
        
        if (motoboyId == null || motoboyId.isBlank()) {
            log.warn("Requisição sem header X-Motoboy-Id");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Header X-Motoboy-Id é obrigatório"));
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

