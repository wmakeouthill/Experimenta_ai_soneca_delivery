package com.snackbar.pedidos.application.usecases;

import com.snackbar.pedidos.application.dto.HistoricoPedidoClienteDTO;
import com.snackbar.pedidos.application.dto.HistoricoPedidosResponseDTO;
import com.snackbar.pedidos.application.ports.PedidoRepositoryPort;
import com.snackbar.pedidos.domain.entities.ItemPedido;
import com.snackbar.pedidos.domain.entities.ItemPedidoAdicional;
import com.snackbar.pedidos.domain.entities.Pedido;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Use case para buscar histórico de pedidos do cliente.
 */
@Service
@RequiredArgsConstructor
public class BuscarHistoricoPedidosClienteUseCase {

        private final PedidoRepositoryPort pedidoRepository;

        /**
         * Busca histórico de pedidos do cliente paginado.
         *
         * @param clienteId ID do cliente
         * @param pagina    Número da página (0-indexed)
         * @param tamanho   Tamanho da página
         * @return Histórico de pedidos paginado
         */
        public HistoricoPedidosResponseDTO executar(String clienteId, int pagina, int tamanho) {
                Pageable pageable = PageRequest.of(pagina, tamanho, Sort.by(Sort.Direction.DESC, "dataPedido"));

                Page<Pedido> paginaPedidos = pedidoRepository.buscarPorClienteId(clienteId, pageable);

                List<HistoricoPedidoClienteDTO> pedidosDTO = paginaPedidos.getContent().stream()
                                .map(this::toDTO)
                                .toList();

                return HistoricoPedidosResponseDTO.builder()
                                .pedidos(pedidosDTO)
                                .paginaAtual(paginaPedidos.getNumber())
                                .totalPaginas(paginaPedidos.getTotalPages())
                                .totalPedidos(paginaPedidos.getTotalElements())
                                .build();
        }

        private HistoricoPedidoClienteDTO toDTO(Pedido pedido) {
                List<HistoricoPedidoClienteDTO.ItemHistoricoDTO> itensDTO = pedido.getItens().stream()
                                .map(this::toItemDTO)
                                .toList();

                return HistoricoPedidoClienteDTO.builder()
                                .id(pedido.getId())
                                .numeroPedido(pedido.getNumeroPedido() != null
                                                ? Integer.parseInt(pedido.getNumeroPedido().getNumero())
                                                : null)
                                .status(pedido.getStatus().name())
                                .statusDescricao(pedido.getStatus().getDescricao())
                                .dataHoraPedido(pedido.getDataPedido())
                                .valorTotal(pedido.getValorTotal() != null ? pedido.getValorTotal().getAmount() : null)
                                .numeroMesa(pedido.getNumeroMesa())
                                .itens(itensDTO)
                                .build();
        }

        private HistoricoPedidoClienteDTO.ItemHistoricoDTO toItemDTO(ItemPedido item) {
                List<HistoricoPedidoClienteDTO.AdicionalHistoricoDTO> adicionaisDTO = null;
                if (item.getAdicionais() != null && !item.getAdicionais().isEmpty()) {
                        adicionaisDTO = item.getAdicionais().stream()
                                        .map(this::toAdicionalDTO)
                                        .toList();
                }

                return HistoricoPedidoClienteDTO.ItemHistoricoDTO.builder()
                                .produtoId(item.getProdutoId())
                                .nomeProduto(item.getProdutoNome())
                                .quantidade(item.getQuantidade())
                                .precoUnitario(item.getPrecoUnitario() != null ? item.getPrecoUnitario().getAmount()
                                                : null)
                                .subtotal(item.calcularSubtotal() != null ? item.calcularSubtotal().getAmount() : null)
                                .adicionais(adicionaisDTO)
                                .build();
        }

        private HistoricoPedidoClienteDTO.AdicionalHistoricoDTO toAdicionalDTO(ItemPedidoAdicional adicional) {
                return HistoricoPedidoClienteDTO.AdicionalHistoricoDTO.builder()
                                .adicionalId(adicional.getAdicionalId())
                                .nome(adicional.getAdicionalNome())
                                .quantidade(adicional.getQuantidade())
                                .precoUnitario(adicional.getPrecoUnitario() != null
                                                ? adicional.getPrecoUnitario().getAmount()
                                                : null)
                                .subtotal(adicional.calcularSubtotal() != null
                                                ? adicional.calcularSubtotal().getAmount()
                                                : null)
                                .build();
        }
}
