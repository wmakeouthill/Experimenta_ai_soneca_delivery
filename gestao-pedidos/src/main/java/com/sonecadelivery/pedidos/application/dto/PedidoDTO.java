package com.sonecadelivery.pedidos.application.dto;

import com.sonecadelivery.pedidos.domain.entities.Pedido;
import com.sonecadelivery.pedidos.domain.entities.StatusPedido;
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

        // ========== Campos de Delivery ==========
        private String tipoPedido;
        private String enderecoEntrega;
        private String motoboyId;
        private String motoboyNome;
        private String motoboyApelido; // Apelido (nome exibido) do motoboy
        private String motoboyTelefone; // Telefone do motoboy para contato
        private BigDecimal taxaEntrega;
        private BigDecimal valorMotoboy; // Valor pago ao motoboy por esta entrega (padrão R$ 5,00)
        private LocalDateTime previsaoEntrega;
        private Double latitude; // Latitude do endereço de entrega do cliente
        private Double longitude; // Longitude do endereço de entrega do cliente

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
                                .tipoPedido(pedido.getTipoPedido() != null ? pedido.getTipoPedido().name() : "BALCAO")
                                .enderecoEntrega(pedido.getEnderecoEntrega())
                                .motoboyId(pedido.getMotoboyId())
                                .taxaEntrega(pedido.getTaxaEntrega() != null ? pedido.getTaxaEntrega().getAmount()
                                                : null)
                                .valorMotoboy(pedido.getValorMotoboy() != null ? pedido.getValorMotoboy().getAmount()
                                                : new BigDecimal("5.00"))
                                .previsaoEntrega(pedido.getPrevisaoEntrega())
                                .dataPedido(pedido.getDataPedido())
                                .dataFinalizacao(pedido.getDataFinalizacao())
                                .createdAt(pedido.getCreatedAt())
                                .updatedAt(pedido.getUpdatedAt())
                                .build();
        }

        /**
         * Converte um Pedido de domínio para DTO, incluindo o nome do motoboy.
         * Use este método quando tiver acesso ao nome do motoboy.
         */
        public static PedidoDTO de(Pedido pedido, String motoboyNome) {
                PedidoDTO dto = de(pedido);
                dto.setMotoboyNome(motoboyNome);
                return dto;
        }

        /**
         * Converte um Pedido de domínio para DTO, incluindo informações completas do
         * motoboy.
         * Use este método para impressão de cupom de delivery com dados do motoboy.
         * 
         * @param pedido          Pedido de domínio
         * @param motoboyNome     Nome do motoboy (nome Google)
         * @param motoboyApelido  Apelido do motoboy (nome exibido)
         * @param motoboyTelefone Telefone do motoboy para contato
         */
        public static PedidoDTO de(Pedido pedido, String motoboyNome, String motoboyApelido, String motoboyTelefone) {
                PedidoDTO dto = de(pedido);
                dto.setMotoboyNome(motoboyNome);
                dto.setMotoboyApelido(motoboyApelido);
                dto.setMotoboyTelefone(motoboyTelefone);
                return dto;
        }
}
