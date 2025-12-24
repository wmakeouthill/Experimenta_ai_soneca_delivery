package com.sonecadelivery.pedidos.application.usecases;

import com.sonecadelivery.kernel.domain.exceptions.NotFoundException;
import com.sonecadelivery.pedidos.application.dto.PedidoDTO;
import com.sonecadelivery.pedidos.application.ports.MotoboyRepositoryPort;
import com.sonecadelivery.pedidos.domain.entities.Motoboy;
import com.sonecadelivery.pedidos.domain.entities.StatusPedido;
import com.sonecadelivery.pedidos.infrastructure.persistence.PedidoDeliveryEntity;
import com.sonecadelivery.pedidos.infrastructure.persistence.PedidoDeliveryJpaRepository;
import com.sonecadelivery.pedidos.infrastructure.persistence.PedidoEntity;
import com.sonecadelivery.pedidos.infrastructure.persistence.PedidoJpaRepository;
import com.sonecadelivery.pedidos.infrastructure.mappers.PedidoMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Use case para listar pedidos de um motoboy específico.
 * Filtra apenas pedidos atribuídos ao motoboy logado.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ListarPedidosDoMotoboyUseCase {

    private final PedidoJpaRepository pedidoJpaRepository;
    private final PedidoDeliveryJpaRepository pedidoDeliveryJpaRepository;
    private final MotoboyRepositoryPort motoboyRepository;
    private final PedidoMapper pedidoMapper;

    /**
     * Lista todos os pedidos do motoboy (apenas PRONTO e SAIU_PARA_ENTREGA).
     */
    @Transactional(readOnly = true)
    public List<PedidoDTO> executar(String motoboyId) {
        log.info("Listando pedidos do motoboy: {}", motoboyId);

        // Verificar se motoboy existe
        motoboyRepository.buscarPorId(motoboyId)
                .orElseThrow(() -> new NotFoundException("Motoboy não encontrado"));

        List<PedidoDTO> pedidos = new ArrayList<>();

        // Buscar pedidos normais (não-delivery) atribuídos ao motoboy
        List<PedidoEntity> pedidosNormais = pedidoJpaRepository.findByMotoboyIdOrderByCreatedAtDesc(motoboyId);
        pedidos.addAll(converterPedidosNormais(pedidosNormais));

        // Buscar pedidos delivery atribuídos ao motoboy
        List<PedidoDeliveryEntity> pedidosDelivery = pedidoDeliveryJpaRepository
                .findByMotoboyIdOrderByCreatedAtDesc(motoboyId);
        pedidos.addAll(converterPedidosDelivery(pedidosDelivery));

        // Filtrar apenas pedidos com status PRONTO ou SAIU_PARA_ENTREGA
        pedidos = pedidos.stream()
                .filter(p -> p.getStatus() == StatusPedido.PRONTO || p.getStatus() == StatusPedido.SAIU_PARA_ENTREGA)
                .collect(Collectors.toList());

        // Ordenar por data de criação (mais recentes primeiro)
        pedidos.sort((p1, p2) -> p2.getCreatedAt().compareTo(p1.getCreatedAt()));

        log.info("Encontrados {} pedidos para o motoboy {}", pedidos.size(), motoboyId);
        return pedidos;
    }

    private List<PedidoDTO> converterPedidosNormais(List<PedidoEntity> entities) {
        // Buscar nome do motoboy
        String motoboyNome = motoboyRepository.buscarPorId(entities.isEmpty() ? null : 
                entities.get(0).getMotoboyId())
                .map(Motoboy::getNomeExibicao)
                .orElse(null);

        // Converter Entity -> Domain -> DTO
        return entities.stream()
                .map(pedidoMapper::paraDomain)
                .map(pedido -> PedidoDTO.de(pedido, motoboyNome))
                .collect(Collectors.toList());
    }

    private List<PedidoDTO> converterPedidosDelivery(List<PedidoDeliveryEntity> entities) {
        // Buscar nome do motoboy
        String motoboyNome = motoboyRepository.buscarPorId(entities.isEmpty() ? null : 
                entities.get(0).getMotoboyId())
                .map(Motoboy::getNomeExibicao)
                .orElse(null);

        // Converter Delivery Entity -> DTO (similar ao ListarPedidosUseCase)
        return entities.stream()
                .map(entity -> mapDeliveryToDTO(entity, motoboyNome))
                .collect(Collectors.toList());
    }

    private PedidoDTO mapDeliveryToDTO(PedidoDeliveryEntity entity, String motoboyNome) {
        return PedidoDTO.builder()
                .id(entity.getId())
                .numeroPedido(entity.getNumeroPedido())
                .clienteId(entity.getClienteId())
                .clienteNome(entity.getNomeCliente())
                .status(mapDeliveryStatus(entity.getStatus()))
                .itens(entity.getItens().stream()
                        .map(item -> com.sonecadelivery.pedidos.application.dto.ItemPedidoDTO.builder()
                                .produtoId(item.getProdutoId())
                                .produtoNome(item.getNomeProduto())
                                .quantidade(item.getQuantidade())
                                .precoUnitario(item.getPrecoUnitario())
                                .subtotal(item.getSubtotal())
                                .observacoes(item.getObservacoes())
                                .adicionais(item.getAdicionais() != null
                                        ? item.getAdicionais().stream()
                                                .map(ad -> com.sonecadelivery.pedidos.application.dto.ItemPedidoAdicionalDTO.builder()
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
                        .map(mp -> com.sonecadelivery.pedidos.application.dto.MeioPagamentoDTO.builder()
                                .meioPagamento(mapMeioPagamento(mp.getTipoPagamento()))
                                .valor(mp.getValor())
                                .build())
                        .toList())
                .tipoPedido(entity.getTipoPedido().name())
                .enderecoEntrega(entity.getEnderecoEntrega())
                .motoboyId(entity.getMotoboyId())
                .motoboyNome(motoboyNome)
                .taxaEntrega(entity.getTaxaEntrega())
                .valorMotoboy(entity.getValorMotoboy() != null ? entity.getValorMotoboy() : new java.math.BigDecimal("5.00"))
                .previsaoEntrega(entity.getPrevisaoEntrega())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    private StatusPedido mapDeliveryStatus(PedidoDeliveryEntity.StatusPedidoDelivery status) {
        return switch (status) {
            case AGUARDANDO_ACEITACAO -> StatusPedido.PENDENTE;
            case ACEITO, PREPARANDO -> StatusPedido.PREPARANDO;
            case PRONTO, SAIU_PARA_ENTREGA -> StatusPedido.PRONTO;
            case ENTREGUE, FINALIZADO -> StatusPedido.FINALIZADO;
            case CANCELADO -> StatusPedido.CANCELADO;
            default -> StatusPedido.PENDENTE;
        };
    }

    private com.sonecadelivery.pedidos.domain.entities.MeioPagamento mapMeioPagamento(String tipo) {
        try {
            return com.sonecadelivery.pedidos.domain.entities.MeioPagamento.valueOf(tipo);
        } catch (IllegalArgumentException e) {
            return com.sonecadelivery.pedidos.domain.entities.MeioPagamento.DINHEIRO;
        }
    }
}

