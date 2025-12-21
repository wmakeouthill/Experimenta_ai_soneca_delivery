package com.sonecadelivery.pedidos.application.usecases;

import com.sonecadelivery.kernel.domain.exceptions.ValidationException;
import com.sonecadelivery.pedidos.application.dto.PedidoPendenteDTO;
import com.sonecadelivery.pedidos.application.services.FilaPedidosMesaService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Use case para funcionário rejeitar um pedido pendente de mesa.
 * O pedido é simplesmente removido da fila sem criar pedido no sistema.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RejeitarPedidoMesaUseCase {

    private final FilaPedidosMesaService filaPedidosMesa;

    public PedidoPendenteDTO executar(String pedidoPendenteId, String usuarioId, String motivo) {
        if (pedidoPendenteId == null || pedidoPendenteId.isBlank()) {
            throw new ValidationException("ID do pedido pendente é obrigatório");
        }

        PedidoPendenteDTO pedidoPendente = filaPedidosMesa.buscarPorId(pedidoPendenteId)
                .orElseThrow(() -> new ValidationException(
                        "Pedido pendente não encontrado ou já foi processado: " + pedidoPendenteId));

        filaPedidosMesa.removerPedido(pedidoPendenteId);

        log.info("Pedido rejeitado - ID: {}, Mesa: {}, Usuário: {}, Motivo: {}",
                pedidoPendenteId,
                pedidoPendente.getNumeroMesa(),
                usuarioId,
                motivo != null ? motivo : "Não informado");

        return pedidoPendente;
    }
}
