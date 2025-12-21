package com.sonecadelivery.cardapio.application.usecases;

import com.sonecadelivery.cardapio.application.ports.AdicionalRepositoryPort;
import com.sonecadelivery.kernel.domain.exceptions.ValidationException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ExcluirAdicionalUseCase {

    private final AdicionalRepositoryPort adicionalRepository;

    public void executar(String id) {
        if (!adicionalRepository.existePorId(id)) {
            throw new ValidationException("Adicional não encontrado com ID: " + id);
        }

        adicionalRepository.excluir(id);
    }
}
