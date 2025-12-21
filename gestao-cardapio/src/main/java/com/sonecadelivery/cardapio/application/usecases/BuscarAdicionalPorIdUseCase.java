package com.sonecadelivery.cardapio.application.usecases;

import com.sonecadelivery.cardapio.application.dto.AdicionalDTO;
import com.sonecadelivery.cardapio.application.ports.AdicionalRepositoryPort;
import com.sonecadelivery.kernel.domain.exceptions.ValidationException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class BuscarAdicionalPorIdUseCase {

    private final AdicionalRepositoryPort adicionalRepository;

    public AdicionalDTO executar(String id) {
        return adicionalRepository.buscarPorId(id)
                .map(AdicionalDTO::de)
                .orElseThrow(() -> new ValidationException("Adicional não encontrado com ID: " + id));
    }
}
