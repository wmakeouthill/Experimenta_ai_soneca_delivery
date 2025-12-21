package com.sonecadelivery.pedidos.application.usecases;

import com.sonecadelivery.pedidos.application.dto.MesaDTO;
import com.sonecadelivery.pedidos.application.ports.MesaRepositoryPort;
import com.sonecadelivery.pedidos.domain.entities.Mesa;
import com.sonecadelivery.pedidos.domain.exceptions.MesaNaoEncontradaException;
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
