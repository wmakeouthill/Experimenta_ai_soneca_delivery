package com.sonecadelivery.pedidos.infrastructure.persistence;

import com.sonecadelivery.pedidos.application.ports.PedidoRepositoryPort;
import com.sonecadelivery.pedidos.domain.entities.Pedido;
import com.sonecadelivery.pedidos.domain.entities.StatusPedido;
import com.sonecadelivery.pedidos.infrastructure.mappers.PedidoMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class PedidoRepositoryAdapter implements PedidoRepositoryPort {

    private final PedidoJpaRepository jpaRepository;
    private final PedidoMapper mapper;

    @Override
    @SuppressWarnings("null") // jpaRepository.save() nunca retorna null
    public Pedido salvar(@NonNull Pedido pedido) {
        PedidoEntity entity = mapper.paraEntity(pedido);
        PedidoEntity salvo = jpaRepository.save(entity);
        return mapper.paraDomain(salvo);
    }

    @Override
    public Optional<Pedido> buscarPorId(@NonNull String id) {
        return jpaRepository.findById(id)
                .map(mapper::paraDomain);
    }

    @Override
    public List<Pedido> buscarTodos() {
        return jpaRepository.findAll().stream()
                .map(mapper::paraDomain)
                .toList();
    }

    @Override
    public List<Pedido> buscarPorStatus(StatusPedido status) {
        return jpaRepository.findByStatus(status).stream()
                .map(mapper::paraDomain)
                .toList();
    }

    @Override
    public List<Pedido> buscarPorClienteId(String clienteId) {
        return jpaRepository.findByClienteId(clienteId).stream()
                .map(mapper::paraDomain)
                .toList();
    }

    @Override
    public Page<Pedido> buscarPorClienteId(String clienteId, Pageable pageable) {
        return jpaRepository.findByClienteId(clienteId, pageable)
                .map(mapper::paraDomain);
    }

    @Override
    public List<Pedido> buscarPorDataPedido(LocalDateTime dataInicio, LocalDateTime dataFim) {
        return jpaRepository.findByDataPedidoBetween(dataInicio, dataFim).stream()
                .map(mapper::paraDomain)
                .toList();
    }

    @Override
    public List<Pedido> buscarPorStatusEData(StatusPedido status, LocalDateTime dataInicio, LocalDateTime dataFim) {
        return jpaRepository.findByStatusAndDataPedidoBetween(status, dataInicio, dataFim).stream()
                .map(mapper::paraDomain)
                .toList();
    }

    @Override
    public List<Pedido> buscarPorSessaoId(String sessaoId) {
        return jpaRepository.findBySessaoId(sessaoId).stream()
                .map(mapper::paraDomain)
                .toList();
    }

    @Override
    public List<Pedido> buscarPorDataInicioSessao(LocalDate dataInicio) {
        return jpaRepository.findByDataInicioSessao(java.sql.Date.valueOf(dataInicio)).stream()
                .map(mapper::paraDomain)
                .toList();
    }

    @Override
    public int buscarUltimoNumeroPedido() {
        return jpaRepository.findMaxNumeroPedido()
                .orElse(0);
    }

    @Override
    public void excluir(@NonNull String id) {
        jpaRepository.deleteById(id);
    }

    @Override
    public List<Pedido> buscarPorMotoboyId(String motoboyId) {
        return jpaRepository.findByMotoboyIdOrderByCreatedAtDesc(motoboyId).stream()
                .map(mapper::paraDomain)
                .toList();
    }
}
