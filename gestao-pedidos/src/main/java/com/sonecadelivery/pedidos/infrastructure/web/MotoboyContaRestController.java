package com.sonecadelivery.pedidos.infrastructure.web;

import com.sonecadelivery.pedidos.application.dto.MotoboyDTO;
import com.sonecadelivery.pedidos.application.dto.PedidoDTO;
import com.sonecadelivery.pedidos.application.usecases.GerenciarMotoboysUseCase;
import com.sonecadelivery.pedidos.application.usecases.ListarPedidosDoMotoboyUseCase;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller REST protegido para operações de conta do motoboy.
 * Endpoints que requerem autenticação JWT de motoboy.
 */
@RestController
@RequestMapping("/api/motoboy")
@RequiredArgsConstructor
public class MotoboyContaRestController {

    private final GerenciarMotoboysUseCase gerenciarMotoboysUseCase;
    private final ListarPedidosDoMotoboyUseCase listarPedidosDoMotoboyUseCase;

    /**
     * Obtém dados do motoboy logado.
     * GET /api/motoboy/me
     * O motoboyId virá do token JWT (será extraído via header ou SecurityContext)
     */
    @GetMapping("/me")
    public ResponseEntity<MotoboyDTO> me(@RequestHeader("X-Motoboy-Id") String motoboyId) {
        MotoboyDTO motoboy = gerenciarMotoboysUseCase.buscarPorId(motoboyId);
        return ResponseEntity.ok(motoboy);
    }

    /**
     * Lista pedidos do motoboy logado.
     * GET /api/motoboy/pedidos
     * Retorna apenas pedidos com status PRONTO ou SAIU_PARA_ENTREGA atribuídos ao motoboy.
     */
    @GetMapping("/pedidos")
    public ResponseEntity<List<PedidoDTO>> listarPedidos(@RequestHeader("X-Motoboy-Id") String motoboyId) {
        List<PedidoDTO> pedidos = listarPedidosDoMotoboyUseCase.executar(motoboyId);
        return ResponseEntity.ok(pedidos);
    }
}

