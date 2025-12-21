package com.snackbar.pedidos.application.usecases;

import com.snackbar.pedidos.application.ports.MesaRepositoryPort;
import com.snackbar.pedidos.domain.exceptions.MesaNaoEncontradaException;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Use case para excluir uma mesa.
 */
@Service
@RequiredArgsConstructor
public class ExcluirMesaUseCase {

    private final MesaRepositoryPort mesaRepository;

    @Transactional
    public void executar(@NonNull String id) {
        if (mesaRepository.buscarPorId(id).isEmpty()) {
            throw MesaNaoEncontradaException.porId(id);
        }
        mesaRepository.excluir(id);
    }
}
