package com.snackbar.pedidos.application.usecases;

import com.snackbar.pedidos.application.dto.MesaDTO;
import com.snackbar.pedidos.application.ports.MesaRepositoryPort;
import com.snackbar.pedidos.domain.entities.Mesa;
import com.snackbar.pedidos.domain.exceptions.MesaNaoEncontradaException;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;

/**
 * Use case para buscar mesa por token QR Code.
 */
@Service
@RequiredArgsConstructor
public class BuscarMesaPorTokenUseCase {

    private final MesaRepositoryPort mesaRepository;

    public MesaDTO executar(@NonNull String token) {
        Mesa mesa = mesaRepository.buscarPorQrCodeToken(token)
                .orElseThrow(() -> MesaNaoEncontradaException.porToken(token));
        return MesaDTO.de(mesa);
    }
}
