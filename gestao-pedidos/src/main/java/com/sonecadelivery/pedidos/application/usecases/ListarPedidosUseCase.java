package com.sonecadelivery.pedidos.application.usecases;

import com.sonecadelivery.pedidos.application.dto.PedidoDTO;
import com.sonecadelivery.pedidos.application.ports.MotoboyRepositoryPort;
import com.sonecadelivery.pedidos.application.ports.PedidoRepositoryPort;
import com.sonecadelivery.pedidos.domain.entities.Motoboy;
import com.sonecadelivery.pedidos.domain.entities.Pedido;
import com.sonecadelivery.pedidos.domain.entities.StatusPedido;
import com.sonecadelivery.pedidos.infrastructure.persistence.PedidoDeliveryEntity;
import com.sonecadelivery.pedidos.infrastructure.persistence.PedidoDeliveryJpaRepository;
import com.sonecadelivery.pedidos.application.dto.ItemPedidoDTO;
import com.sonecadelivery.pedidos.application.dto.ItemPedidoAdicionalDTO;
import com.sonecadelivery.pedidos.application.dto.MeioPagamentoDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import com.sonecadelivery.pedidos.domain.entities.MeioPagamento;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ListarPedidosUseCase {

    private final PedidoRepositoryPort pedidoRepository;
    private final PedidoDeliveryJpaRepository pedidoDeliveryRepository;
    private final MotoboyRepositoryPort motoboyRepository;
    private final com.sonecadelivery.pedidos.application.ports.ClienteGatewayPort clienteGateway;

    public List<PedidoDTO> executar() {
        List<Pedido> pedidos = pedidoRepository.buscarTodos();
        List<PedidoDTO> dtos = new java.util.ArrayList<>(converterComNomesMotoboy(pedidos));

        List<PedidoDeliveryEntity> pedidosDelivery = pedidoDeliveryRepository.findPedidosAtivos();
        dtos.addAll(converterDelivery(pedidosDelivery));

        // Ordenar por data de criação (mais recentes primeiro)
        dtos.sort((p1, p2) -> p2.getCreatedAt().compareTo(p1.getCreatedAt()));

        return dtos;
    }

    public List<PedidoDTO> executarPorStatus(StatusPedido status) {
        List<Pedido> pedidos = pedidoRepository.buscarPorStatus(status);
        List<PedidoDTO> dtos = new ArrayList<>(converterComNomesMotoboy(pedidos));

        List<PedidoDeliveryEntity.StatusPedidoDelivery> deliveryStatuses = mapToDeliveryStatus(status);
        if (!deliveryStatuses.isEmpty()) {
            List<PedidoDeliveryEntity> pedidosDelivery = pedidoDeliveryRepository
                    .findByStatusInOrderByCreatedAtAsc(deliveryStatuses);
            dtos.addAll(converterDelivery(pedidosDelivery));
        }

        dtos.sort((p1, p2) -> p2.getCreatedAt().compareTo(p1.getCreatedAt()));
        return dtos;
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
     * Converte lista de pedidos para DTOs, buscando nomes de motoboys e coordenadas de clientes
     * de forma otimizada.
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

        // Coleta IDs únicos de clientes para buscar coordenadas
        Set<String> clienteIds = pedidos.stream()
                .filter(p -> p.getClienteId() != null && p.getTipoPedido() != null 
                        && p.getTipoPedido().name().equals("DELIVERY"))
                .map(Pedido::getClienteId)
                .collect(Collectors.toSet());

        // Busca coordenadas dos clientes de forma otimizada
        Map<String, com.sonecadelivery.pedidos.application.dto.ClientePublicoDTO> clientesPorId = new java.util.HashMap<>();
        if (!clienteIds.isEmpty()) {
            for (String clienteId : clienteIds) {
                clienteGateway.buscarPorId(clienteId)
                        .ifPresent(cliente -> clientesPorId.put(clienteId, cliente));
            }
        }

        // Converte pedidos para DTOs com nome do motoboy e coordenadas
        final Map<String, String> nomesFinais = nomesPorId;
        final Map<String, com.sonecadelivery.pedidos.application.dto.ClientePublicoDTO> clientesFinais = clientesPorId;
        return pedidos.stream()
                .map(pedido -> {
                    String motoboyNome = pedido.getMotoboyId() != null
                            ? nomesFinais.get(pedido.getMotoboyId())
                            : null;
                    PedidoDTO dto = PedidoDTO.de(pedido, motoboyNome);
                    
                    // Adiciona coordenadas do cliente se disponíveis
                    if (pedido.getClienteId() != null) {
                        com.sonecadelivery.pedidos.application.dto.ClientePublicoDTO cliente = clientesFinais.get(pedido.getClienteId());
                        if (cliente != null) {
                            dto.setLatitude(cliente.getLatitude());
                            dto.setLongitude(cliente.getLongitude());
                        }
                    }
                    
                    return dto;
                })
                .toList();
    }

    private List<PedidoDTO> converterDelivery(List<PedidoDeliveryEntity> pedidos) {
        return pedidos.stream()
                .map(this::mapDeliveryToDTO)
                .toList();
    }

    private PedidoDTO mapDeliveryToDTO(PedidoDeliveryEntity entity) {
        PedidoDTO.PedidoDTOBuilder builder = PedidoDTO.builder()
                .id(entity.getId())
                .numeroPedido(entity.getNumeroPedido())
                .clienteId(entity.getClienteId())
                .clienteNome(entity.getNomeCliente())
                .status(mapDeliveryStatus(entity.getStatus()))
                .itens(entity.getItens().stream()
                        .map(item -> ItemPedidoDTO.builder()
                                .produtoId(item.getProdutoId())
                                .produtoNome(item.getNomeProduto())
                                .quantidade(item.getQuantidade())
                                .precoUnitario(item.getPrecoUnitario())
                                .subtotal(item.getSubtotal())
                                .observacoes(item.getObservacoes())
                                .adicionais(item.getAdicionais() != null
                                        ? item.getAdicionais().stream()
                                                .map(ad -> ItemPedidoAdicionalDTO.builder()
                                                        .adicionalId(ad.getAdicionalId())
                                                        .adicionalNome(ad.getNomeAdicional())
                                                        .quantidade(ad.getQuantidade())
                                                        .precoUnitario(ad.getPrecoUnitario())
                                                        .subtotal(ad.getSubtotal())
                                                        .build())
                                                .toList()
                                        : null)
                                .build())
                        .toList())
                .valorTotal(entity.getValorTotal())
                .observacoes(entity.getObservacoes())
                .meiosPagamento(entity.getMeiosPagamento().stream()
                        .map(mp -> MeioPagamentoDTO.builder()
                                // Tenta mapear o tipo string para o enum, ou usa um valor padrão se falhar
                                .meioPagamento(mapMeioPagamento(mp.getTipoPagamento()))
                                .valor(mp.getValor())
                                .build())
                        .toList())
                .tipoPedido(entity.getTipoPedido().name())
                .enderecoEntrega(entity.getEnderecoEntrega())
                .motoboyId(entity.getMotoboyId())
                .motoboyNome(entity.getMotoboyNome())
                .taxaEntrega(entity.getTaxaEntrega())
                .valorMotoboy(entity.getValorMotoboy() != null ? entity.getValorMotoboy() : new java.math.BigDecimal("5.00"))
                .previsaoEntrega(entity.getPrevisaoEntrega())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt());
        
        // Busca coordenadas do cliente se disponível
        if (entity.getClienteId() != null) {
            clienteGateway.buscarPorId(entity.getClienteId())
                    .ifPresent(cliente -> {
                        builder.latitude(cliente.getLatitude());
                        builder.longitude(cliente.getLongitude());
                    });
        }
        
        return builder.build();
    }

    private StatusPedido mapDeliveryStatus(PedidoDeliveryEntity.StatusPedidoDelivery status) {
        switch (status) {
            case AGUARDANDO_ACEITACAO:
                return StatusPedido.PENDENTE;
            case ACEITO:
            case PREPARANDO:
                return StatusPedido.PREPARANDO;
            case PRONTO:
            case SAIU_PARA_ENTREGA:
                return StatusPedido.PRONTO;
            case ENTREGUE:
            case FINALIZADO:
                return StatusPedido.FINALIZADO;
            case CANCELADO:
                return StatusPedido.CANCELADO;
            default:
                return StatusPedido.PENDENTE;
        }
    }

    private MeioPagamento mapMeioPagamento(String tipo) {
        try {
            return MeioPagamento.valueOf(tipo);
        } catch (IllegalArgumentException e) {
            return MeioPagamento.DINHEIRO;
        }
    }

    private List<PedidoDeliveryEntity.StatusPedidoDelivery> mapToDeliveryStatus(StatusPedido status) {
        if (status == StatusPedido.PENDENTE) {
            return List.of(PedidoDeliveryEntity.StatusPedidoDelivery.AGUARDANDO_ACEITACAO);
        } else if (status == StatusPedido.PREPARANDO) {
            return List.of(PedidoDeliveryEntity.StatusPedidoDelivery.ACEITO,
                    PedidoDeliveryEntity.StatusPedidoDelivery.PREPARANDO);
        } else if (status == StatusPedido.PRONTO) {
            return List.of(PedidoDeliveryEntity.StatusPedidoDelivery.PRONTO,
                    PedidoDeliveryEntity.StatusPedidoDelivery.SAIU_PARA_ENTREGA);
        } else if (status == StatusPedido.FINALIZADO) {
            return List.of(PedidoDeliveryEntity.StatusPedidoDelivery.ENTREGUE,
                    PedidoDeliveryEntity.StatusPedidoDelivery.FINALIZADO);
        } else if (status == StatusPedido.CANCELADO) {
            return List.of(PedidoDeliveryEntity.StatusPedidoDelivery.CANCELADO);
        }
        return List.of();
    }
}