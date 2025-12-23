package com.sonecadelivery.pedidos.application.usecases;

import com.sonecadelivery.kernel.domain.exceptions.BusinessException;
import com.sonecadelivery.kernel.domain.exceptions.NotFoundException;
import com.sonecadelivery.pedidos.application.dto.PedidoDTO;
import com.sonecadelivery.pedidos.application.ports.MotoboyRepositoryPort;
import com.sonecadelivery.pedidos.application.ports.PedidoRepositoryPort;
import com.sonecadelivery.pedidos.domain.entities.Motoboy;
import com.sonecadelivery.pedidos.domain.entities.Pedido;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Use case para atribuição de motoboy a um pedido de delivery.
 * 
 * GARANTIAS ACID:
 * - Atomicidade: @Transactional garante que busca + validação + atribuição +
 * salvar
 * são uma operação atômica
 * - Consistência: Validações garantem invariantes (motoboy ativo, pedido
 * delivery)
 * - Isolamento: Transação Spring garante isolamento adequado
 * - Durabilidade: Commit ao final da transação persiste alteração
 * 
 * PROTEÇÃO DE CONCORRÊNCIA:
 * - Optimistic Locking via @Version na entidade Pedido detecta atualizações
 * concorrentes
 */
@Service
@RequiredArgsConstructor
public class AtribuirMotoboyPedidoUseCase {

    private final PedidoRepositoryPort pedidoRepository;
    private final MotoboyRepositoryPort motoboyRepository;

    /**
     * Atribui um motoboy a um pedido de delivery.
     * 
     * @param pedidoId  ID do pedido
     * @param motoboyId ID do motoboy a ser atribuído
     * @return PedidoDTO com o nome do motoboy populado
     * @throws NotFoundException se pedido ou motoboy não forem encontrados
     * @throws BusinessException se motoboy não estiver ativo
     */
    @Transactional
    @SuppressWarnings("null")
    public PedidoDTO executar(@NonNull String pedidoId, @NonNull String motoboyId) {
        // 1. Buscar pedido (dentro da transação para garantir consistência)
        Pedido pedido = pedidoRepository.buscarPorId(pedidoId)
                .orElseThrow(() -> new NotFoundException("Pedido não encontrado com ID: " + pedidoId));

        // 2. Buscar motoboy e validar se existe e está ativo
        Motoboy motoboy = motoboyRepository.buscarPorId(motoboyId)
                .orElseThrow(() -> new NotFoundException("Motoboy não encontrado com ID: " + motoboyId));

        if (!motoboy.isAtivo()) {
            throw new BusinessException("Motoboy '" + motoboy.getNome() + "' não está ativo");
        }

        // 3. Atribuir motoboy (validação de tipo DELIVERY está no domain)
        pedido.atribuirMotoboy(motoboyId);

        // 4. Salvar pedido atualizado
        Pedido pedidoAtualizado = pedidoRepository.salvar(pedido);

        // 5. Retornar DTO com nome do motoboy
        return PedidoDTO.de(pedidoAtualizado, motoboy.getNome());
    }
}
