package com.sonecadelivery.pedidos.application.usecases;

import com.sonecadelivery.kernel.domain.exceptions.ValidationException;
import com.sonecadelivery.pedidos.application.dto.AtualizarMesaRequest;
import com.sonecadelivery.pedidos.application.dto.MesaDTO;
import com.sonecadelivery.pedidos.application.ports.MesaRepositoryPort;
import com.sonecadelivery.pedidos.domain.entities.Mesa;
import com.sonecadelivery.pedidos.domain.exceptions.MesaNaoEncontradaException;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Use case para atualizar uma mesa existente.
 */
@Service
@RequiredArgsConstructor
public class AtualizarMesaUseCase {

    private final MesaRepositoryPort mesaRepository;

    @Transactional
    public MesaDTO executar(@NonNull String id, AtualizarMesaRequest request) {
        Mesa mesa = buscarMesa(id);

        aplicarAtualizacoes(mesa, request, id);

        Mesa mesaAtualizada = mesaRepository.salvar(mesa);
        return MesaDTO.de(mesaAtualizada);
    }

    private Mesa buscarMesa(String id) {
        return mesaRepository.buscarPorId(id)
                .orElseThrow(() -> MesaNaoEncontradaException.porId(id));
    }

    private void aplicarAtualizacoes(Mesa mesa, AtualizarMesaRequest request, String id) {
        if (request.getNumero() != null) {
            validarNumeroUnico(request.getNumero(), id);
            mesa.atualizarNumero(request.getNumero());
        }

        if (request.getNome() != null && !request.getNome().isBlank()) {
            mesa.atualizarNome(request.getNome());
        }

        if (request.getAtiva() != null) {
            if (request.getAtiva()) {
                mesa.ativar();
            } else {
                mesa.desativar();
            }
        }
    }

    private void validarNumeroUnico(int numero, String idAtual) {
        if (mesaRepository.existePorNumeroExcetoId(numero, idAtual)) {
            throw new ValidationException("Já existe uma mesa com o número " + numero);
        }
    }
}
