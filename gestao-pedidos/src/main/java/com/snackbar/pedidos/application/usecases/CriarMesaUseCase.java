package com.snackbar.pedidos.application.usecases;

import com.snackbar.kernel.domain.exceptions.ValidationException;
import com.snackbar.pedidos.application.dto.CriarMesaRequest;
import com.snackbar.pedidos.application.dto.MesaDTO;
import com.snackbar.pedidos.application.ports.MesaRepositoryPort;
import com.snackbar.pedidos.domain.entities.Mesa;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Use case para criar uma nova mesa.
 */
@Service
@RequiredArgsConstructor
public class CriarMesaUseCase {

    private final MesaRepositoryPort mesaRepository;

    @Transactional
    public MesaDTO executar(CriarMesaRequest request) {
        validarNumeroUnico(request.getNumero());

        Mesa mesa = Mesa.criar(request.getNumero(), request.getNome());
        Mesa mesaSalva = mesaRepository.salvar(mesa);

        return MesaDTO.de(mesaSalva);
    }

    private void validarNumeroUnico(int numero) {
        if (mesaRepository.existePorNumero(numero)) {
            throw new ValidationException("Já existe uma mesa com o número " + numero);
        }
    }
}
