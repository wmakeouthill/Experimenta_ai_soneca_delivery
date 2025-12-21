package com.sonecadelivery.clientes.application.ports;

import com.sonecadelivery.clientes.domain.entities.ClienteAvaliacao;
import org.springframework.lang.NonNull;

import java.util.List;
import java.util.Optional;

public interface ClienteAvaliacaoRepositoryPort {

    ClienteAvaliacao salvar(@NonNull ClienteAvaliacao avaliacao);

    void remover(@NonNull String id);

    /**
     * Busca avaliação por cliente, produto e pedido específico
     */
    Optional<ClienteAvaliacao> buscar(@NonNull String clienteId, @NonNull String produtoId, @NonNull String pedidoId);

    /**
     * Busca avaliação por cliente e produto (qualquer pedido) - para
     * retrocompatibilidade
     */
    Optional<ClienteAvaliacao> buscarPorClienteProduto(@NonNull String clienteId, @NonNull String produtoId);

    Optional<ClienteAvaliacao> buscarPorId(@NonNull String id);

    List<ClienteAvaliacao> buscarPorCliente(@NonNull String clienteId);

    List<ClienteAvaliacao> buscarPorProduto(@NonNull String produtoId);

    List<ClienteAvaliacao> buscarPorPedido(@NonNull String pedidoId);

    Double calcularMediaPorProduto(@NonNull String produtoId);

    int contarAvaliacoesPorProduto(@NonNull String produtoId);
}
