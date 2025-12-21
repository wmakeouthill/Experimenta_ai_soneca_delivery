package com.sonecadelivery.pedidos.infrastructure.persistence;

import com.sonecadelivery.pedidos.application.dto.AdicionalPedidoPendenteDTO;
import com.sonecadelivery.pedidos.application.dto.ItemPedidoPendenteDTO;
import com.sonecadelivery.pedidos.application.dto.MeioPagamentoRequest;
import com.sonecadelivery.pedidos.application.dto.PedidoPendenteDTO;
import com.sonecadelivery.pedidos.application.ports.PedidoPendenteRepositoryPort;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Implementação do repositório de pedidos pendentes usando JPA.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class PedidoPendenteRepositoryAdapter implements PedidoPendenteRepositoryPort {

    private final PedidoPendenteJpaRepository jpaRepository;

    @Override
    @Transactional
    public PedidoPendenteDTO salvar(PedidoPendenteDTO dto) {
        PedidoPendenteEntity entity = toEntity(dto);
        PedidoPendenteEntity salvo = jpaRepository.save(entity);
        log.debug("Pedido pendente salvo - ID: {}", salvo.getId());
        return toDTO(salvo);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PedidoPendenteDTO> listarPendentes() {
        return jpaRepository.findPendentes().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<PedidoPendenteDTO> buscarPendentePorId(String id) {
        return jpaRepository.findPendenteById(id)
                .map(this::toDTO);
    }

    @Override
    @Transactional
    public Optional<PedidoPendenteDTO> buscarPendentePorIdComLock(String id) {
        return jpaRepository.findPendenteByIdComLock(id)
                .map(this::toDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<PedidoPendenteDTO> buscarPorId(String id) {
        return jpaRepository.findById(id)
                .map(this::toDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public long contarPendentes() {
        return jpaRepository.countPendentes();
    }

    @Override
    @Transactional
    public void remover(String id) {
        jpaRepository.deleteById(id);
        log.debug("Pedido pendente removido - ID: {}", id);
    }

    @Override
    @Transactional
    public int removerExpirados(long tempoLimiteMinutos) {
        LocalDateTime limite = LocalDateTime.now().minusMinutes(tempoLimiteMinutos);
        int removidos = jpaRepository.deleteExpirados(limite);
        if (removidos > 0) {
            log.info("Removidos {} pedidos pendentes expirados (limite: {} minutos)",
                    removidos, tempoLimiteMinutos);
        }
        return removidos;
    }

    @Override
    @Transactional
    public void marcarComoAceito(String pedidoPendenteId, String pedidoRealId) {
        int updated = jpaRepository.marcarComoAceito(pedidoPendenteId, pedidoRealId);
        if (updated > 0) {
            log.info("Pedido pendente {} marcado como aceito -> pedido real {}",
                    pedidoPendenteId, pedidoRealId);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<String> buscarPedidoRealPorPendente(String pedidoPendenteId) {
        return jpaRepository.findPedidoRealIdByPendenteId(pedidoPendenteId);
    }

    // ========== Mapeamentos ==========

    private PedidoPendenteEntity toEntity(PedidoPendenteDTO dto) {
        PedidoPendenteEntity entity = PedidoPendenteEntity.builder()
                .id(dto.getId())
                .mesaToken(dto.getMesaToken())
                .mesaId(dto.getMesaId())
                .numeroMesa(dto.getNumeroMesa())
                .clienteId(dto.getClienteId())
                .nomeCliente(dto.getNomeCliente())
                .telefoneCliente(dto.getTelefoneCliente())
                .observacoes(dto.getObservacoes())
                .valorTotal(dto.getValorTotal())
                .dataHoraSolicitacao(dto.getDataHoraSolicitacao())
                // Campos de delivery
                .tipoPedido(dto.getTipoPedido() != null
                        ? com.sonecadelivery.pedidos.domain.entities.TipoPedido.valueOf(dto.getTipoPedido())
                        : com.sonecadelivery.pedidos.domain.entities.TipoPedido.MESA)
                .enderecoEntrega(dto.getEnderecoEntrega())
                .previsaoEntregaCliente(dto.getPrevisaoEntregaCliente())
                .build();

        if (dto.getItens() != null) {
            for (ItemPedidoPendenteDTO itemDTO : dto.getItens()) {
                ItemPedidoPendenteEntity itemEntity = ItemPedidoPendenteEntity.builder()
                        .produtoId(itemDTO.getProdutoId())
                        .nomeProduto(itemDTO.getNomeProduto())
                        .quantidade(itemDTO.getQuantidade())
                        .precoUnitario(itemDTO.getPrecoUnitario())
                        .subtotal(itemDTO.getSubtotal())
                        .observacoes(itemDTO.getObservacoes())
                        .build();

                // Mapear adicionais do item
                if (itemDTO.getAdicionais() != null) {
                    for (AdicionalPedidoPendenteDTO adicionalDTO : itemDTO.getAdicionais()) {
                        AdicionalItemPedidoPendenteEntity adicionalEntity = AdicionalItemPedidoPendenteEntity.builder()
                                .adicionalId(adicionalDTO.getAdicionalId())
                                .nome(adicionalDTO.getNome())
                                .quantidade(adicionalDTO.getQuantidade())
                                .precoUnitario(adicionalDTO.getPrecoUnitario())
                                .subtotal(adicionalDTO.getSubtotal())
                                .build();
                        itemEntity.adicionarAdicional(adicionalEntity);
                    }
                }

                entity.adicionarItem(itemEntity);
            }
        }

        // Mapear meios de pagamento
        if (dto.getMeiosPagamento() != null) {
            for (MeioPagamentoRequest mpRequest : dto.getMeiosPagamento()) {
                MeioPagamentoPendenteEntity mpEntity = MeioPagamentoPendenteEntity.builder()
                        .meioPagamento(mpRequest.getMeioPagamento())
                        .valor(mpRequest.getValor())
                        .build();
                entity.adicionarMeioPagamento(mpEntity);
            }
        }

        return entity;
    }

    private PedidoPendenteDTO toDTO(PedidoPendenteEntity entity) {
        List<ItemPedidoPendenteDTO> itensDTO = entity.getItens().stream()
                .map(item -> {
                    // Mapear adicionais do item
                    List<AdicionalPedidoPendenteDTO> adicionaisDTO = null;
                    if (item.getAdicionais() != null && !item.getAdicionais().isEmpty()) {
                        adicionaisDTO = item.getAdicionais().stream()
                                .map(ad -> AdicionalPedidoPendenteDTO.builder()
                                        .adicionalId(ad.getAdicionalId())
                                        .nome(ad.getNome())
                                        .quantidade(ad.getQuantidade())
                                        .precoUnitario(ad.getPrecoUnitario())
                                        .subtotal(ad.getSubtotal())
                                        .build())
                                .collect(Collectors.toList());
                    }

                    return ItemPedidoPendenteDTO.builder()
                            .produtoId(item.getProdutoId())
                            .nomeProduto(item.getNomeProduto())
                            .quantidade(item.getQuantidade())
                            .precoUnitario(item.getPrecoUnitario())
                            .subtotal(item.getSubtotal())
                            .observacoes(item.getObservacoes())
                            .adicionais(adicionaisDTO)
                            .build();
                })
                .collect(Collectors.toList());

        // Mapear meios de pagamento
        List<MeioPagamentoRequest> meiosPagamentoDTO = new ArrayList<>();
        if (entity.getMeiosPagamento() != null) {
            meiosPagamentoDTO = entity.getMeiosPagamento().stream()
                    .map(mp -> new MeioPagamentoRequest(mp.getMeioPagamento(), mp.getValor()))
                    .collect(Collectors.toList());
        }

        long tempoEspera = Duration.between(
                entity.getDataHoraSolicitacao(),
                LocalDateTime.now()).getSeconds();

        return PedidoPendenteDTO.builder()
                .id(entity.getId())
                .mesaToken(entity.getMesaToken())
                .mesaId(entity.getMesaId())
                .numeroMesa(entity.getNumeroMesa())
                .clienteId(entity.getClienteId())
                .nomeCliente(entity.getNomeCliente())
                .telefoneCliente(entity.getTelefoneCliente())
                .itens(itensDTO)
                .meiosPagamento(meiosPagamentoDTO)
                .observacoes(entity.getObservacoes())
                .valorTotal(entity.getValorTotal())
                .dataHoraSolicitacao(entity.getDataHoraSolicitacao())
                .tempoEsperaSegundos(tempoEspera)
                // Campos de delivery
                .tipoPedido(entity.getTipoPedido() != null ? entity.getTipoPedido().name() : "MESA")
                .enderecoEntrega(entity.getEnderecoEntrega())
                .previsaoEntregaCliente(entity.getPrevisaoEntregaCliente())
                .build();
    }
}
