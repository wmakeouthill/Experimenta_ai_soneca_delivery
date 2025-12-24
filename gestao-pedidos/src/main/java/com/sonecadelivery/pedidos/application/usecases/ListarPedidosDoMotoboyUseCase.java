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
import org.hibernate.Hibernate;
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
        long inicio = System.currentTimeMillis();
        log.info("Listando pedidos do motoboy: {}", motoboyId);

        // Verificar se motoboy existe e obter nome uma única vez
        Motoboy motoboy = motoboyRepository.buscarPorId(motoboyId)
                .orElseThrow(() -> new NotFoundException("Motoboy não encontrado"));
        String motoboyNome = motoboy.getNomeExibicao();

        List<PedidoDTO> pedidos = new ArrayList<>();

        // Buscar pedidos normais (não-delivery) atribuídos ao motoboy
        long inicioNormais = System.currentTimeMillis();
        List<PedidoEntity> pedidosNormais = pedidoJpaRepository.findByMotoboyIdOrderByCreatedAtDesc(motoboyId);
        pedidos.addAll(converterPedidosNormais(pedidosNormais, motoboyNome));
        log.debug("Pedidos normais processados em {}ms", System.currentTimeMillis() - inicioNormais);

        // Buscar pedidos delivery atribuídos ao motoboy
        // A query já filtra por status PRONTO ou SAIU_PARA_ENTREGA
        long inicioDelivery = System.currentTimeMillis();
        List<PedidoDeliveryEntity> pedidosDelivery = pedidoDeliveryJpaRepository
                .findByMotoboyIdOrderByCreatedAtDesc(motoboyId);
        
        log.debug("Encontrados {} pedidos delivery para o motoboy {} (query executada em {}ms)", 
                pedidosDelivery.size(), motoboyId, System.currentTimeMillis() - inicioDelivery);
        
        // Inicializar relacionamentos lazy dentro da transação
        // Isso evita LazyInitializationException e problemas com múltiplos JOIN FETCH
        long inicioInicializacao = System.currentTimeMillis();
        for (PedidoDeliveryEntity pedido : pedidosDelivery) {
            try {
                // Força o carregamento dos relacionamentos lazy usando Hibernate.initialize()
                Hibernate.initialize(pedido.getItens());
                if (pedido.getItens() != null) {
                    for (var item : pedido.getItens()) {
                        Hibernate.initialize(item.getAdicionais());
                    }
                }
                Hibernate.initialize(pedido.getMeiosPagamento());
            } catch (Exception e) {
                log.warn("Erro ao inicializar relacionamentos do pedido {}: {}", pedido.getId(), e.getMessage());
            }
        }
        log.debug("Relacionamentos inicializados em {}ms", System.currentTimeMillis() - inicioInicializacao);
        
        pedidos.addAll(converterPedidosDelivery(pedidosDelivery, motoboyNome));

        // Ordenar por data de criação (mais recentes primeiro)
        pedidos.sort((p1, p2) -> p2.getCreatedAt().compareTo(p1.getCreatedAt()));

        long tempoTotal = System.currentTimeMillis() - inicio;
        log.info("Encontrados {} pedidos para o motoboy {} (processado em {}ms)", 
                pedidos.size(), motoboyId, tempoTotal);
        return pedidos;
    }

    private List<PedidoDTO> converterPedidosNormais(List<PedidoEntity> entities, String motoboyNome) {
        if (entities.isEmpty()) {
            return new ArrayList<>();
        }

        // Converter Entity -> Domain -> DTO
        return entities.stream()
                .map(pedidoMapper::paraDomain)
                .map(pedido -> PedidoDTO.de(pedido, motoboyNome))
                .collect(Collectors.toList());
    }

    private List<PedidoDTO> converterPedidosDelivery(List<PedidoDeliveryEntity> entities, String motoboyNome) {
        if (entities.isEmpty()) {
            return new ArrayList<>();
        }

        // Converter Delivery Entity -> DTO (similar ao ListarPedidosUseCase)
        return entities.stream()
                .map(entity -> mapDeliveryToDTO(entity, motoboyNome))
                .collect(Collectors.toList());
    }

    private PedidoDTO mapDeliveryToDTO(PedidoDeliveryEntity entity, String motoboyNome) {
        try {
            // Mapear itens (similar ao ListarPedidosUseCase)
            List<com.sonecadelivery.pedidos.application.dto.ItemPedidoDTO> itensDTO = new ArrayList<>();
            try {
                if (entity.getItens() != null && !entity.getItens().isEmpty()) {
                    for (var item : entity.getItens()) {
                        try {
                            List<com.sonecadelivery.pedidos.application.dto.ItemPedidoAdicionalDTO> adicionaisDTO = null;
                            try {
                                if (item.getAdicionais() != null && !item.getAdicionais().isEmpty()) {
                                    adicionaisDTO = new ArrayList<>();
                                    for (var ad : item.getAdicionais()) {
                                        try {
                                            adicionaisDTO.add(com.sonecadelivery.pedidos.application.dto.ItemPedidoAdicionalDTO.builder()
                                                    .adicionalId(ad.getAdicionalId())
                                                    .adicionalNome(ad.getNomeAdicional())
                                                    .quantidade(ad.getQuantidade())
                                                    .precoUnitario(ad.getPrecoUnitario())
                                                    .subtotal(ad.getSubtotal())
                                                    .build());
                                        } catch (Exception e) {
                                            log.warn("Erro ao mapear adicional do item {}: {}", item.getId(), e.getMessage(), e);
                                        }
                                    }
                                }
                            } catch (Exception e) {
                                log.warn("Erro ao acessar adicionais do item {}: {}", item.getId(), e.getMessage(), e);
                            }
                            
                            itensDTO.add(com.sonecadelivery.pedidos.application.dto.ItemPedidoDTO.builder()
                                    .produtoId(item.getProdutoId())
                                    .produtoNome(item.getNomeProduto())
                                    .quantidade(item.getQuantidade())
                                    .precoUnitario(item.getPrecoUnitario())
                                    .subtotal(item.getSubtotal())
                                    .observacoes(item.getObservacoes())
                                    .adicionais(adicionaisDTO)
                                    .build());
                        } catch (Exception e) {
                            log.warn("Erro ao mapear item do pedido {}: {}", entity.getId(), e.getMessage(), e);
                        }
                    }
                }
            } catch (Exception e) {
                log.error("Erro ao acessar itens do pedido {}: {}", entity.getId(), e.getMessage(), e);
            }

            // Mapear meios de pagamento (similar ao ListarPedidosUseCase)
            List<com.sonecadelivery.pedidos.application.dto.MeioPagamentoDTO> meiosPagamentoDTO = new ArrayList<>();
            try {
                if (entity.getMeiosPagamento() != null && !entity.getMeiosPagamento().isEmpty()) {
                    for (var mp : entity.getMeiosPagamento()) {
                        try {
                            meiosPagamentoDTO.add(com.sonecadelivery.pedidos.application.dto.MeioPagamentoDTO.builder()
                                    .meioPagamento(mapMeioPagamento(mp.getTipoPagamento()))
                                    .valor(mp.getValor())
                                    .build());
                        } catch (Exception e) {
                            log.warn("Erro ao mapear meio de pagamento do pedido {}: {}", entity.getId(), e.getMessage(), e);
                        }
                    }
                }
            } catch (Exception e) {
                log.error("Erro ao acessar meios de pagamento do pedido {}: {}", entity.getId(), e.getMessage(), e);
            }

            return PedidoDTO.builder()
                    .id(entity.getId())
                    .numeroPedido(entity.getNumeroPedido())
                    .clienteId(entity.getClienteId())
                    .clienteNome(entity.getNomeCliente())
                    .status(mapDeliveryStatus(entity.getStatus()))
                    .itens(itensDTO)
                    .valorTotal(entity.getValorTotal())
                    .observacoes(entity.getObservacoes())
                    .meiosPagamento(meiosPagamentoDTO)
                    .tipoPedido(entity.getTipoPedido() != null ? entity.getTipoPedido().name() : null)
                    .enderecoEntrega(entity.getEnderecoEntrega())
                    .motoboyId(entity.getMotoboyId())
                    .motoboyNome(motoboyNome)
                    .taxaEntrega(entity.getTaxaEntrega())
                    .valorMotoboy(entity.getValorMotoboy() != null ? entity.getValorMotoboy() : new java.math.BigDecimal("5.00"))
                    .previsaoEntrega(entity.getPrevisaoEntrega())
                    .createdAt(entity.getCreatedAt())
                    .updatedAt(entity.getUpdatedAt())
                    .build();
        } catch (Exception e) {
            log.error("Erro crítico ao mapear PedidoDeliveryEntity para DTO. Pedido ID: {}", entity.getId(), e);
            // Retorna um DTO mínimo em caso de erro para não quebrar toda a lista
            return PedidoDTO.builder()
                    .id(entity.getId())
                    .numeroPedido(entity.getNumeroPedido())
                    .clienteId(entity.getClienteId())
                    .clienteNome(entity.getNomeCliente() != null ? entity.getNomeCliente() : "Cliente")
                    .status(mapDeliveryStatus(entity.getStatus()))
                    .itens(new ArrayList<>())
                    .valorTotal(entity.getValorTotal())
                    .observacoes(entity.getObservacoes())
                    .meiosPagamento(new ArrayList<>())
                    .tipoPedido(entity.getTipoPedido() != null ? entity.getTipoPedido().name() : null)
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
    }

    private StatusPedido mapDeliveryStatus(PedidoDeliveryEntity.StatusPedidoDelivery status) {
        return switch (status) {
            case AGUARDANDO_ACEITACAO -> StatusPedido.PENDENTE;
            case ACEITO, PREPARANDO -> StatusPedido.PREPARANDO;
            case PRONTO -> StatusPedido.PRONTO;
            case SAIU_PARA_ENTREGA -> StatusPedido.SAIU_PARA_ENTREGA;
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

