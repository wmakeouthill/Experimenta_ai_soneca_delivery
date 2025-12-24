package com.sonecadelivery.pedidos.application.usecases;

import com.sonecadelivery.pedidos.application.dto.AtualizarStatusPedidoRequest;
import com.sonecadelivery.pedidos.application.dto.PedidoDTO;
import com.sonecadelivery.pedidos.application.ports.PedidoRepositoryPort;
import com.sonecadelivery.pedidos.domain.entities.Pedido;
import com.sonecadelivery.pedidos.domain.entities.StatusPedido;
import com.sonecadelivery.pedidos.domain.services.PedidoValidator;
import com.sonecadelivery.kernel.domain.exceptions.ValidationException;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Use case para atualização de status de pedido.
 * 
 * PROTEÇÃO DE CONCORRÊNCIA:
 * - @Transactional garante atomicidade da operação
 * - Optimistic Locking via @Version na entidade detecta atualizações
 * concorrentes
 * 
 * SEGURANÇA:
 * - Valida se o motoboy pode finalizar o pedido (apenas o motoboy atribuído)
 */
@Service
@RequiredArgsConstructor
public class AtualizarStatusPedidoUseCase {

    private final PedidoRepositoryPort pedidoRepository;
    private final PedidoValidator pedidoValidator;

    @Transactional
    @SuppressWarnings("null") // repository.salvar() nunca retorna null, .orElseThrow() nunca retorna null
    public PedidoDTO executar(@NonNull String id, AtualizarStatusPedidoRequest request) {
        return executar(id, request, null);
    }

    /**
     * Executa a atualização de status com validação de segurança para motoboy.
     * 
     * @param id ID do pedido
     * @param request Request com novo status
     * @param motoboyIdRequisicao ID do motoboy que está fazendo a requisição (opcional, para validação de segurança)
     * @return PedidoDTO atualizado
     */
    @Transactional
    @SuppressWarnings("null")
    public PedidoDTO executar(@NonNull String id, AtualizarStatusPedidoRequest request, String motoboyIdRequisicao) {
        Pedido pedido = pedidoRepository.buscarPorId(id)
                .orElseThrow(() -> new ValidationException("Pedido não encontrado com ID: " + id));

        pedidoValidator.validarAtualizacaoStatus(pedido, request.getStatus());
        
        // Validação de segurança: se está finalizando e há motoboy atribuído, verifica se é o mesmo
        if (request.getStatus() == StatusPedido.FINALIZADO && motoboyIdRequisicao != null) {
            pedidoValidator.validarFinalizacaoPorMotoboy(pedido, motoboyIdRequisicao);
        }
        
        pedido.atualizarStatus(request.getStatus());

        Pedido pedidoAtualizado = pedidoRepository.salvar(pedido);

        return PedidoDTO.de(pedidoAtualizado);
    }
}
