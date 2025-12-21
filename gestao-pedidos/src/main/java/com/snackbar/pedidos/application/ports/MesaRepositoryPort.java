package com.snackbar.pedidos.application.ports;

import com.snackbar.pedidos.domain.entities.Mesa;

import java.util.List;
import java.util.Optional;

/**
 * Port de repositório para Mesa.
 * Define as operações de persistência que a camada de domínio precisa.
 */
public interface MesaRepositoryPort {

    Mesa salvar(Mesa mesa);

    Optional<Mesa> buscarPorId(String id);

    Optional<Mesa> buscarPorNumero(int numero);

    Optional<Mesa> buscarPorQrCodeToken(String token);

    List<Mesa> buscarTodas();

    List<Mesa> buscarAtivas();

    void excluir(String id);

    boolean existePorNumero(int numero);

    boolean existePorNumeroExcetoId(int numero, String id);
}
