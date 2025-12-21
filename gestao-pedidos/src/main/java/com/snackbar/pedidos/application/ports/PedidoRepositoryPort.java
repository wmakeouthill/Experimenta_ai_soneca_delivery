package com.snackbar.pedidos.application.ports;

import com.snackbar.pedidos.domain.entities.Pedido;
import com.snackbar.pedidos.domain.entities.StatusPedido;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.lang.NonNull;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface PedidoRepositoryPort {
    Pedido salvar(@NonNull Pedido pedido);

    Optional<Pedido> buscarPorId(@NonNull String id);

    List<Pedido> buscarTodos();

    List<Pedido> buscarPorStatus(StatusPedido status);

    List<Pedido> buscarPorClienteId(String clienteId);

    Page<Pedido> buscarPorClienteId(String clienteId, Pageable pageable);

    List<Pedido> buscarPorDataPedido(LocalDateTime dataInicio, LocalDateTime dataFim);

    List<Pedido> buscarPorStatusEData(StatusPedido status, LocalDateTime dataInicio, LocalDateTime dataFim);

    List<Pedido> buscarPorSessaoId(String sessaoId);

    List<Pedido> buscarPorDataInicioSessao(LocalDate dataInicio);

    int buscarUltimoNumeroPedido();

    void excluir(@NonNull String id);
}
