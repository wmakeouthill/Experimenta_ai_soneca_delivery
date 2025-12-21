package com.snackbar.cardapio.application.usecases;

import com.snackbar.cardapio.application.dto.AtualizarAdicionalRequest;
import com.snackbar.cardapio.application.dto.AdicionalDTO;
import com.snackbar.cardapio.application.ports.AdicionalRepositoryPort;
import com.snackbar.cardapio.domain.entities.Adicional;
import com.snackbar.cardapio.domain.valueobjects.Preco;
import com.snackbar.kernel.domain.exceptions.ValidationException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AtualizarAdicionalUseCase {

    private final AdicionalRepositoryPort adicionalRepository;

    public AdicionalDTO executar(String id, AtualizarAdicionalRequest request) {
        Adicional adicional = adicionalRepository.buscarPorId(id)
                .orElseThrow(() -> new ValidationException("Adicional não encontrado com ID: " + id));

        if (request.getNome() != null) {
            adicional.atualizarNome(request.getNome());
        }

        if (request.getDescricao() != null) {
            adicional.atualizarDescricao(request.getDescricao());
        }

        if (request.getPreco() != null) {
            adicional.atualizarPreco(Preco.of(request.getPreco()));
        }

        if (request.getCategoria() != null) {
            adicional.atualizarCategoria(request.getCategoria());
        }

        if (request.getDisponivel() != null) {
            if (request.getDisponivel()) {
                adicional.marcarComoDisponivel();
            } else {
                adicional.marcarComoIndisponivel();
            }
        }

        @SuppressWarnings("null")
        Adicional adicionalAtualizado = adicionalRepository.salvar(adicional);

        return AdicionalDTO.de(adicionalAtualizado);
    }
}
