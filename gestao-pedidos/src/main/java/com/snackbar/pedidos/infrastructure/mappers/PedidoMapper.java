package com.snackbar.pedidos.infrastructure.mappers;

import com.snackbar.cardapio.domain.valueobjects.Preco;
import com.snackbar.pedidos.domain.entities.ItemPedido;
import com.snackbar.pedidos.domain.entities.ItemPedidoAdicional;
import com.snackbar.pedidos.domain.entities.MeioPagamentoPedido;
import com.snackbar.pedidos.domain.entities.Pedido;
import com.snackbar.pedidos.domain.valueobjects.NumeroPedido;
import com.snackbar.pedidos.infrastructure.persistence.ItemPedidoAdicionalEntity;
import com.snackbar.pedidos.infrastructure.persistence.ItemPedidoEntity;
import com.snackbar.pedidos.infrastructure.persistence.MeioPagamentoPedidoEntity;
import com.snackbar.pedidos.infrastructure.persistence.PedidoEntity;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Component
public class PedidoMapper {

    public PedidoEntity paraEntity(Pedido pedido) {
        PedidoEntity.PedidoEntityBuilder builder = PedidoEntity.builder()
                .id(pedido.getId())
                .numeroPedido(pedido.getNumeroPedido().getNumero())
                .clienteId(pedido.getClienteId())
                .clienteNome(pedido.getClienteNome())
                .status(pedido.getStatus())
                .valorTotal(pedido.getValorTotal().getAmount())
                .observacoes(pedido.getObservacoes())
                .usuarioId(pedido.getUsuarioId())
                .sessaoId(pedido.getSessaoId())
                .mesaId(pedido.getMesaId())
                .numeroMesa(pedido.getNumeroMesa())
                .nomeClienteMesa(pedido.getNomeClienteMesa())
                .tipoPedido(pedido.getTipoPedido())
                .enderecoEntrega(pedido.getEnderecoEntrega())
                .motoboyId(pedido.getMotoboyId())
                .taxaEntrega(pedido.getTaxaEntrega() != null ? pedido.getTaxaEntrega().getAmount() : null)
                .previsaoEntrega(pedido.getPrevisaoEntrega())
                .dataPedido(pedido.getDataPedido())
                .dataFinalizacao(pedido.getDataFinalizacao())
                .createdAt(pedido.getCreatedAt())
                .updatedAt(pedido.getUpdatedAt());

        // Só seta version se não for null (para novas entidades, deixa o
        // @Builder.Default usar 0L)
        if (pedido.getVersion() != null) {
            builder.version(pedido.getVersion());
        }

        PedidoEntity entity = builder.build();

        Set<ItemPedidoEntity> itensEntity = new HashSet<>();
        for (ItemPedido item : pedido.getItens()) {
            ItemPedidoEntity itemEntity = ItemPedidoEntity.builder()
                    .pedido(entity)
                    .produtoId(item.getProdutoId())
                    .produtoNome(item.getProdutoNome())
                    .quantidade(item.getQuantidade())
                    .precoUnitario(item.getPrecoUnitario().getAmount())
                    .observacoes(item.getObservacoes())
                    .build();

            // Mapeia adicionais do item
            if (item.getAdicionais() != null && !item.getAdicionais().isEmpty()) {
                for (ItemPedidoAdicional adicional : item.getAdicionais()) {
                    ItemPedidoAdicionalEntity adicionalEntity = ItemPedidoAdicionalEntity.builder()
                            .adicionalId(adicional.getAdicionalId())
                            .adicionalNome(adicional.getAdicionalNome())
                            .quantidade(adicional.getQuantidade())
                            .precoUnitario(adicional.getPrecoUnitario().getAmount())
                            .build();
                    itemEntity.adicionarAdicional(adicionalEntity);
                }
            }
            itensEntity.add(itemEntity);
        }
        entity.setItens(itensEntity);

        Set<MeioPagamentoPedidoEntity> meiosPagamentoEntity = new HashSet<>();
        for (MeioPagamentoPedido meioPagamentoPedido : pedido.getMeiosPagamento()) {
            MeioPagamentoPedidoEntity meioPagamentoEntity = MeioPagamentoPedidoEntity.builder()
                    .pedido(entity)
                    .meioPagamento(meioPagamentoPedido.getMeioPagamento())
                    .valor(meioPagamentoPedido.getValor().getAmount())
                    .build();
            meiosPagamentoEntity.add(meioPagamentoEntity);
        }
        entity.setMeiosPagamento(meiosPagamentoEntity);

        return entity;
    }

    public Pedido paraDomain(PedidoEntity entity) {
        NumeroPedido numeroPedido = NumeroPedido.of(entity.getNumeroPedido());

        // Usa restaurarPedidoDoBanco para evitar validações em dados já existentes
        // Isso permite clienteId null (auto-atendimento) e usuarioId null (pedido mesa)
        Pedido pedido = Pedido.restaurarPedidoDoBanco(
                numeroPedido,
                entity.getClienteId(),
                entity.getClienteNome(),
                entity.getUsuarioId());

        pedido.restaurarDoBanco(
                entity.getId(),
                entity.getCreatedAt(),
                entity.getUpdatedAt());

        // Restaurar itens do banco SEM validações (não estamos adicionando, apenas
        // restaurando)
        List<ItemPedido> itensRestaurados = new ArrayList<>();
        for (ItemPedidoEntity itemEntity : entity.getItens()) {
            Preco precoUnitario = Preco.of(itemEntity.getPrecoUnitario());

            // Restaurar adicionais do item
            List<ItemPedidoAdicional> adicionaisRestaurados = new ArrayList<>();
            if (itemEntity.getAdicionais() != null) {
                for (ItemPedidoAdicionalEntity adicionalEntity : itemEntity.getAdicionais()) {
                    Preco precoAdicional = Preco.of(adicionalEntity.getPrecoUnitario());
                    ItemPedidoAdicional adicional = ItemPedidoAdicional.criar(
                            adicionalEntity.getAdicionalId(),
                            adicionalEntity.getAdicionalNome(),
                            adicionalEntity.getQuantidade(),
                            precoAdicional);
                    adicionaisRestaurados.add(adicional);
                }
            }

            ItemPedido item = ItemPedido.criar(
                    itemEntity.getProdutoId(),
                    itemEntity.getProdutoNome(),
                    itemEntity.getQuantidade(),
                    precoUnitario,
                    itemEntity.getObservacoes(),
                    adicionaisRestaurados);
            itensRestaurados.add(item);
        }
        pedido.restaurarItensDoBanco(itensRestaurados);

        // Restaurar meios de pagamento do banco
        List<MeioPagamentoPedido> meiosPagamentoRestaurados = new ArrayList<>();
        for (MeioPagamentoPedidoEntity meioPagamentoEntity : entity.getMeiosPagamento()) {
            Preco valor = Preco.of(meioPagamentoEntity.getValor());
            MeioPagamentoPedido meioPagamentoPedido = MeioPagamentoPedido.criar(
                    meioPagamentoEntity.getMeioPagamento(),
                    valor);
            meiosPagamentoRestaurados.add(meioPagamentoPedido);
        }
        pedido.restaurarMeiosPagamentoDoBanco(meiosPagamentoRestaurados);

        // Atualizar status e observações DEPOIS de restaurar os itens e meios de
        // pagamento
        pedido.atualizarStatus(entity.getStatus());
        pedido.atualizarObservacoes(entity.getObservacoes());
        pedido.definirSessaoId(entity.getSessaoId());

        // Restaurar dados da mesa (se houver)
        pedido.restaurarMesaDoBanco(entity.getMesaId(), entity.getNumeroMesa(), entity.getNomeClienteMesa());

        // Restaurar dados de delivery (se houver)
        Preco taxaEntrega = entity.getTaxaEntrega() != null ? Preco.of(entity.getTaxaEntrega()) : null;
        pedido.restaurarDeliveryDoBanco(
                entity.getTipoPedido(),
                entity.getEnderecoEntrega(),
                entity.getMotoboyId(),
                taxaEntrega,
                entity.getPrevisaoEntrega());

        // Restaurar data do pedido do banco (preserva a data original de criação)
        pedido.restaurarDataPedidoDoBanco(entity.getDataPedido());

        // Restaurar data de finalização do banco (preserva a data original de
        // finalização)
        pedido.restaurarDataFinalizacaoDoBanco(entity.getDataFinalizacao());

        // Restaurar version para Optimistic Locking (essencial para atualizações)
        pedido.restaurarVersionDoBanco(entity.getVersion());

        return pedido;
    }
}
