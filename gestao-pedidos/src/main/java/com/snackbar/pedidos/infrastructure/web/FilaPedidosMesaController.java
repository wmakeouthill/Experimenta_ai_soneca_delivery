package com.snackbar.pedidos.infrastructure.web;

import com.snackbar.pedidos.application.dto.PedidoDTO;
import com.snackbar.pedidos.application.dto.PedidoPendenteDTO;
import com.snackbar.pedidos.application.services.FilaPedidosMesaService;
import com.snackbar.pedidos.application.usecases.AceitarPedidoMesaUseCase;
import com.snackbar.pedidos.application.usecases.RejeitarPedidoMesaUseCase;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Controller REST para funcionários gerenciarem a fila de pedidos de mesa.
 * 
 * REQUER AUTENTICAÇÃO - apenas funcionários logados podem:
 * - Ver pedidos pendentes na fila
 * - Aceitar pedidos (cria pedido real vinculado ao usuário)
 * - Rejeitar pedidos (remove da fila)
 */
@RestController
@RequestMapping("/api/pedidos/fila-mesa")
@RequiredArgsConstructor
public class FilaPedidosMesaController {

    private final FilaPedidosMesaService filaPedidosMesa;
    private final AceitarPedidoMesaUseCase aceitarPedidoMesaUseCase;
    private final RejeitarPedidoMesaUseCase rejeitarPedidoMesaUseCase;

    /**
     * Lista todos os pedidos pendentes na fila.
     * Ordenados por tempo de espera (mais antigos primeiro).
     */
    @GetMapping
    public ResponseEntity<List<PedidoPendenteDTO>> listarPedidosPendentes() {
        List<PedidoPendenteDTO> pedidos = filaPedidosMesa.listarPedidosPendentes();
        return ResponseEntity.ok(pedidos);
    }

    /**
     * Retorna a quantidade de pedidos pendentes.
     * Útil para mostrar badge/notificação na interface.
     */
    @GetMapping("/quantidade")
    public ResponseEntity<Map<String, Object>> quantidadePedidosPendentes() {
        int quantidade = filaPedidosMesa.quantidadePedidosPendentes();
        return ResponseEntity.ok(Map.of(
                "quantidade", quantidade,
                "existemPendentes", quantidade > 0));
    }

    /**
     * Aceita um pedido pendente.
     * O pedido é criado de verdade no sistema, vinculado ao usuário logado.
     * 
     * @param pedidoId  ID do pedido pendente na fila
     * @param usuarioId ID do usuário que está aceitando (vem do header
     *                  X-Usuario-Id)
     * @return PedidoDTO do pedido criado
     */
    @PostMapping("/{pedidoId}/aceitar")
    public ResponseEntity<PedidoDTO> aceitarPedido(
            @PathVariable String pedidoId,
            @RequestHeader("X-Usuario-Id") String usuarioId) {

        PedidoDTO pedido = aceitarPedidoMesaUseCase.executar(pedidoId, usuarioId);
        return ResponseEntity.ok(pedido);
    }

    /**
     * Rejeita um pedido pendente.
     * O pedido é removido da fila sem criar pedido no sistema.
     * 
     * @param pedidoId  ID do pedido pendente na fila
     * @param usuarioId ID do usuário que está rejeitando (vem do header
     *                  X-Usuario-Id)
     * @param body      Corpo com motivo da rejeição (opcional)
     */
    @PostMapping("/{pedidoId}/rejeitar")
    public ResponseEntity<Map<String, Object>> rejeitarPedido(
            @PathVariable String pedidoId,
            @RequestBody(required = false) Map<String, String> body,
            @RequestHeader("X-Usuario-Id") String usuarioId) {

        String motivo = body != null ? body.get("motivo") : null;

        PedidoPendenteDTO pedidoRejeitado = rejeitarPedidoMesaUseCase.executar(pedidoId, usuarioId, motivo);

        return ResponseEntity.ok(Map.of(
                "mensagem", "Pedido rejeitado com sucesso",
                "pedidoId", pedidoId,
                "mesa", pedidoRejeitado.getNumeroMesa(),
                "cliente", pedidoRejeitado.getNomeCliente()));
    }

    /**
     * Busca detalhes de um pedido pendente específico.
     */
    @GetMapping("/{pedidoId}")
    public ResponseEntity<PedidoPendenteDTO> buscarPedidoPendente(@PathVariable String pedidoId) {
        return filaPedidosMesa.buscarPorId(pedidoId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
