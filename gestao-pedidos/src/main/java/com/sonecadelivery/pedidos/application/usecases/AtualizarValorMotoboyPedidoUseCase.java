package com.sonecadelivery.pedidos.application.usecases;

import com.sonecadelivery.cardapio.domain.valueobjects.Preco;
import com.sonecadelivery.pedidos.application.dto.PedidoDTO;
import com.sonecadelivery.pedidos.application.ports.MotoboyRepositoryPort;
import com.sonecadelivery.pedidos.application.ports.PedidoRepositoryPort;
import com.sonecadelivery.pedidos.domain.entities.Motoboy;
import com.sonecadelivery.pedidos.domain.entities.Pedido;
import com.sonecadelivery.kernel.domain.exceptions.NotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Use case para atualizar o valor a ser pago ao motoboy por uma entrega específica.
 * 
 * Este valor é independente da taxa de entrega cobrada do cliente e representa
 * o valor que será pago ao motoboy no final do dia.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AtualizarValorMotoboyPedidoUseCase {

    private final PedidoRepositoryPort pedidoRepository;
    private final MotoboyRepositoryPort motoboyRepository;

    /**
     * Atualiza o valor a ser pago ao motoboy por esta entrega específica.
     * 
     * @param pedidoId ID do pedido
     * @param valor Valor a ser pago ao motoboy (deve ser >= 0)
     * @return PedidoDTO atualizado com o nome do motoboy populado
     * @throws NotFoundException se pedido ou motoboy não forem encontrados
     */
    @Transactional
    public PedidoDTO executar(@NonNull String pedidoId, @NonNull java.math.BigDecimal valor) {
        log.info("Atualizando valor do motoboy para pedido {}: R$ {}", pedidoId, valor);

        // 1. Buscar pedido
        Pedido pedido = pedidoRepository.buscarPorId(pedidoId)
                .orElseThrow(() -> new NotFoundException("Pedido não encontrado com ID: " + pedidoId));

        // 2. Validar que é pedido de delivery com motoboy
        if (pedido.getMotoboyId() == null) {
            throw new IllegalArgumentException("Pedido não possui motoboy atribuído");
        }

        // 3. Definir valor do motoboy
        Preco valorMotoboy = Preco.of(valor);
        pedido.definirValorMotoboy(valorMotoboy);

        // 4. Salvar pedido
        Pedido pedidoAtualizado = pedidoRepository.salvar(pedido);

        // 5. Buscar nome do motoboy para incluir no DTO
        Motoboy motoboy = motoboyRepository.buscarPorId(pedido.getMotoboyId())
                .orElse(null); // Não falha se motoboy não existir mais

        // 6. Retornar DTO com nome do motoboy
        String motoboyNome = motoboy != null ? motoboy.getNome() : null;
        PedidoDTO dto = PedidoDTO.de(pedidoAtualizado, motoboyNome);

        log.info("Valor do motoboy atualizado com sucesso para pedido {}: R$ {}", pedidoId, valor);
        return dto;
    }
}

