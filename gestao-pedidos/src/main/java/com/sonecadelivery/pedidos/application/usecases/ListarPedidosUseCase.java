package com.sonecadelivery.pedidos.application.usecases;

import com.sonecadelivery.pedidos.application.dto.PedidoDTO;
import com.sonecadelivery.pedidos.application.ports.MotoboyRepositoryPort;
import com.sonecadelivery.pedidos.application.ports.PedidoRepositoryPort;
import com.sonecadelivery.pedidos.domain.entities.Motoboy;
import com.sonecadelivery.pedidos.domain.entities.Pedido;
import com.sonecadelivery.pedidos.domain.entities.StatusPedido;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ListarPedidosUseCase {

    private final PedidoRepositoryPort pedidoRepository;
    private final MotoboyRepositoryPort motoboyRepository;

    public List<PedidoDTO> executar() {
        List<Pedido> pedidos = pedidoRepository.buscarTodos();
        return converterComNomesMotoboy(pedidos);
    }

    public List<PedidoDTO> executarPorStatus(StatusPedido status) {
        List<Pedido> pedidos = pedidoRepository.buscarPorStatus(status);
        return converterComNomesMotoboy(pedidos);
    }

    public List<PedidoDTO> executarPorClienteId(String clienteId) {
        List<Pedido> pedidos = pedidoRepository.buscarPorClienteId(clienteId);
        return converterComNomesMotoboy(pedidos);
    }

    public List<PedidoDTO> executarPorDataPedido(LocalDateTime dataInicio, LocalDateTime dataFim) {
        List<Pedido> pedidos = pedidoRepository.buscarPorDataPedido(dataInicio, dataFim);
        return converterComNomesMotoboy(pedidos);
    }

    public List<PedidoDTO> executarPorStatusEData(StatusPedido status, LocalDateTime dataInicio,
            LocalDateTime dataFim) {
        List<Pedido> pedidos = pedidoRepository.buscarPorStatusEData(status, dataInicio, dataFim);
        return converterComNomesMotoboy(pedidos);
    }

    public List<PedidoDTO> executarPorSessaoId(String sessaoId) {
        List<Pedido> pedidos = pedidoRepository.buscarPorSessaoId(sessaoId);
        return converterComNomesMotoboy(pedidos);
    }

    public List<PedidoDTO> executarPorDataInicioSessao(LocalDate dataInicio) {
        List<Pedido> pedidos = pedidoRepository.buscarPorDataInicioSessao(dataInicio);
        return converterComNomesMotoboy(pedidos);
    }

    /**
     * Converte lista de pedidos para DTOs, buscando nomes de motoboys de forma
     * otimizada.
     */
    private List<PedidoDTO> converterComNomesMotoboy(List<Pedido> pedidos) {
        // Coleta IDs únicos de motoboys
        Set<String> motoboyIds = pedidos.stream()
                .filter(p -> p.getMotoboyId() != null)
                .map(Pedido::getMotoboyId)
                .collect(Collectors.toSet());

        // Busca motoboys em uma única query se houver IDs
        Map<String, String> nomesPorId = Map.of();
        if (!motoboyIds.isEmpty()) {
            nomesPorId = motoboyRepository.buscarPorIds(motoboyIds).stream()
                    .collect(Collectors.toMap(Motoboy::getId, Motoboy::getNome));
        }

        // Converte pedidos para DTOs com nome do motoboy
        final Map<String, String> nomesFinais = nomesPorId;
        return pedidos.stream()
                .map(pedido -> {
                    String motoboyNome = pedido.getMotoboyId() != null
                            ? nomesFinais.get(pedido.getMotoboyId())
                            : null;
                    return PedidoDTO.de(pedido, motoboyNome);
                })
                .toList();
    }
}