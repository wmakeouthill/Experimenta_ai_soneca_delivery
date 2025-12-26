package com.sonecadelivery.pedidos.application.usecases;

import com.sonecadelivery.pedidos.application.dto.PedidoDTO;
import com.sonecadelivery.pedidos.application.ports.MotoboyRepositoryPort;
import com.sonecadelivery.pedidos.application.ports.PedidoRepositoryPort;
import com.sonecadelivery.pedidos.domain.entities.Pedido;
import com.sonecadelivery.kernel.domain.exceptions.ValidationException;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class BuscarPedidoPorIdUseCase {

    private final PedidoRepositoryPort pedidoRepository;
    private final MotoboyRepositoryPort motoboyRepository;

    public PedidoDTO executar(@NonNull String id) {
        if (id == null || id.trim().isEmpty()) {
            throw new ValidationException("ID do pedido não pode ser nulo ou vazio");
        }

        Pedido pedido = pedidoRepository.buscarPorId(id)
                .orElseThrow(() -> new ValidationException("Pedido não encontrado com ID: " + id));

        // Se o pedido tem motoboy designado, busca dados completos do motoboy
        if (pedido.getMotoboyId() != null && !pedido.getMotoboyId().trim().isEmpty()) {
            return motoboyRepository.buscarPorId(pedido.getMotoboyId())
                    .map(motoboy -> PedidoDTO.de(
                            pedido,
                            motoboy.getNome(),
                            motoboy.getApelido(),
                            motoboy.getTelefone()))
                    .orElse(PedidoDTO.de(pedido)); // Fallback se motoboy não encontrado
        }

        // Sem motoboy, retorna DTO simples
        return PedidoDTO.de(pedido);
    }
}
