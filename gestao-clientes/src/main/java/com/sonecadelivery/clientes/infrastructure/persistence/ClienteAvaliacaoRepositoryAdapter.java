package com.sonecadelivery.clientes.infrastructure.persistence;

import com.sonecadelivery.clientes.application.ports.ClienteAvaliacaoRepositoryPort;
import com.sonecadelivery.clientes.domain.entities.ClienteAvaliacao;
import com.sonecadelivery.clientes.infrastructure.mappers.ClienteAvaliacaoMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class ClienteAvaliacaoRepositoryAdapter implements ClienteAvaliacaoRepositoryPort {

    private final ClienteAvaliacaoJpaRepository jpaRepository;
    private final ClienteAvaliacaoMapper mapper;

    @Override
    @SuppressWarnings("null")
    public ClienteAvaliacao salvar(@NonNull ClienteAvaliacao avaliacao) {
        ClienteAvaliacaoEntity entity = mapper.paraEntity(avaliacao);
        ClienteAvaliacaoEntity salvo = jpaRepository.save(entity);
        return mapper.paraDomain(salvo);
    }

    @Override
    public void remover(@NonNull String id) {
        jpaRepository.deleteById(id);
    }

    @Override
    public Optional<ClienteAvaliacao> buscar(@NonNull String clienteId, @NonNull String produtoId,
            @NonNull String pedidoId) {
        return jpaRepository.findByClienteIdAndProdutoIdAndPedidoId(clienteId, produtoId, pedidoId)
                .map(mapper::paraDomain);
    }

    @Override
    public Optional<ClienteAvaliacao> buscarPorClienteProduto(@NonNull String clienteId, @NonNull String produtoId) {
        return jpaRepository.findByClienteIdAndProdutoId(clienteId, produtoId)
                .map(mapper::paraDomain);
    }

    @Override
    public Optional<ClienteAvaliacao> buscarPorId(@NonNull String id) {
        return jpaRepository.findById(id)
                .map(mapper::paraDomain);
    }

    @Override
    public List<ClienteAvaliacao> buscarPorCliente(@NonNull String clienteId) {
        return jpaRepository.findByClienteIdOrderByCreatedAtDesc(clienteId).stream()
                .map(mapper::paraDomain)
                .toList();
    }

    @Override
    public List<ClienteAvaliacao> buscarPorProduto(@NonNull String produtoId) {
        return jpaRepository.findByProdutoIdOrderByCreatedAtDesc(produtoId).stream()
                .map(mapper::paraDomain)
                .toList();
    }

    @Override
    public List<ClienteAvaliacao> buscarPorPedido(@NonNull String pedidoId) {
        return jpaRepository.findByPedidoIdOrderByCreatedAtDesc(pedidoId).stream()
                .map(mapper::paraDomain)
                .toList();
    }

    @Override
    public Double calcularMediaPorProduto(@NonNull String produtoId) {
        return jpaRepository.calcularMediaPorProduto(produtoId);
    }

    @Override
    public int contarAvaliacoesPorProduto(@NonNull String produtoId) {
        return jpaRepository.countByProdutoId(produtoId);
    }
}
