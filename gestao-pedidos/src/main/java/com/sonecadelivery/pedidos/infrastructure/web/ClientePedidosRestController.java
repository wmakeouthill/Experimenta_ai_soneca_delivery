package com.sonecadelivery.pedidos.infrastructure.web;

import com.sonecadelivery.pedidos.application.dto.HistoricoPedidosResponseDTO;
import com.sonecadelivery.pedidos.application.usecases.BuscarHistoricoPedidosClienteUseCase;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controller para operações de pedidos do cliente autenticado.
 */
@RestController
@RequestMapping("/api/cliente/pedidos-historico")
@RequiredArgsConstructor
public class ClientePedidosRestController {

    private final BuscarHistoricoPedidosClienteUseCase buscarHistoricoPedidosClienteUseCase;

    /**
     * Busca histórico de pedidos do cliente paginado.
     * 
     * Endpoint: GET /api/cliente/pedidos-historico
     * 
     * @param clienteId ID do cliente (vem do header ou token JWT)
     * @param pagina    Número da página (0-indexed)
     * @param tamanho   Tamanho da página
     * @return Histórico de pedidos paginado
     */
    @GetMapping
    public ResponseEntity<HistoricoPedidosResponseDTO> buscarHistoricoPedidos(
            @RequestHeader("X-Cliente-Id") String clienteId,
            @RequestParam(defaultValue = "0") int pagina,
            @RequestParam(defaultValue = "10") int tamanho) {

        HistoricoPedidosResponseDTO historico = buscarHistoricoPedidosClienteUseCase.executar(
                clienteId, pagina, tamanho);
        return ResponseEntity.ok(historico);
    }
}
