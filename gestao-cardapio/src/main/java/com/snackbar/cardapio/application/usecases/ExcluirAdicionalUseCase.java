package com.snackbar.cardapio.application.usecases;

import com.snackbar.cardapio.application.ports.AdicionalRepositoryPort;
import com.snackbar.kernel.domain.exceptions.ValidationException;
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
