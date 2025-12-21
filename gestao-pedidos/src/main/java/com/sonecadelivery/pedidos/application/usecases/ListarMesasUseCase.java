package com.sonecadelivery.pedidos.application.usecases;

import com.sonecadelivery.pedidos.application.dto.MesaDTO;
import com.sonecadelivery.pedidos.application.ports.MesaRepositoryPort;
import com.sonecadelivery.pedidos.domain.entities.Mesa;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Use case para listar mesas.
 */
@Service
@RequiredArgsConstructor
public class ListarMesasUseCase {

    private final MesaRepositoryPort mesaRepository;

    public List<MesaDTO> executar() {
        return mesaRepository.buscarTodas().stream()
                .map(MesaDTO::de)
                .toList();
    }

    public List<MesaDTO> executarAtivas() {
        return mesaRepository.buscarAtivas().stream()
                .map(MesaDTO::de)
                .toList();
    }
}
