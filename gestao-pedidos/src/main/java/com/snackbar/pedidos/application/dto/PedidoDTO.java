package com.snackbar.pedidos.application.dto;

import com.snackbar.pedidos.domain.entities.Pedido;
import com.snackbar.pedidos.domain.entities.StatusPedido;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PedidoDTO {
        private String id;
        private String numeroPedido;
        private String clienteId;
        private String clienteNome;
        private StatusPedido status;
        private List<ItemPedidoDTO> itens;
        private BigDecimal valorTotal;
        private String observacoes;
        private List<MeioPagamentoDTO> meiosPagamento;
        private String usuarioId;
        private String sessaoId;
        private String mesaId;
        private Integer numeroMesa;
        private String nomeClienteMesa;
        private LocalDateTime dataPedido;
        private LocalDateTime dataFinalizacao;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public static PedidoDTO de(Pedido pedido) {
                return PedidoDTO.builder()
                                .id(pedido.getId())
                                .numeroPedido(pedido.getNumeroPedido().getNumero())
                                .clienteId(pedido.getClienteId())
                                .clienteNome(pedido.getClienteNome())
                                .status(pedido.getStatus())
                                .itens(pedido.getItens().stream()
                                                .map(item -> ItemPedidoDTO.builder()
                                                                .produtoId(item.getProdutoId())
                                                                .produtoNome(item.getProdutoNome())
                                                                .quantidade(item.getQuantidade())
                                                                .precoUnitario(item.getPrecoUnitario().getAmount())
                                                                .subtotal(item.calcularSubtotal().getAmount())
                                                                .observacoes(item.getObservacoes())
                                                                .adicionais(item.getAdicionais() != null
                                                                                ? item.getAdicionais().stream()
                                                                                                .map(ad -> ItemPedidoAdicionalDTO
                                                                                                                .builder()
                                                                                                                .adicionalId(ad.getAdicionalId())
                                                                                                                .adicionalNome(ad
                                                                                                                                .getAdicionalNome())
                                                                                                                .quantidade(ad.getQuantidade())
                                                                                                                .precoUnitario(ad
                                                                                                                                .getPrecoUnitario()
                                                                                                                                .getAmount())
                                                                                                                .subtotal(ad.calcularSubtotal()
                                                                                                                                .getAmount())
                                                                                                                .build())
                                                                                                .toList()
                                                                                : null)
                                                                .build())
                                                .toList())
                                .valorTotal(pedido.getValorTotal().getAmount())
                                .observacoes(pedido.getObservacoes())
                                .meiosPagamento(pedido.getMeiosPagamento().stream()
                                                .map(MeioPagamentoDTO::de)
                                                .toList())
                                .usuarioId(pedido.getUsuarioId())
                                .sessaoId(pedido.getSessaoId())
                                .mesaId(pedido.getMesaId())
                                .numeroMesa(pedido.getNumeroMesa())
                                .nomeClienteMesa(pedido.getNomeClienteMesa())
                                .dataPedido(pedido.getDataPedido())
                                .dataFinalizacao(pedido.getDataFinalizacao())
                                .createdAt(pedido.getCreatedAt())
                                .updatedAt(pedido.getUpdatedAt())
                                .build();
        }
}
