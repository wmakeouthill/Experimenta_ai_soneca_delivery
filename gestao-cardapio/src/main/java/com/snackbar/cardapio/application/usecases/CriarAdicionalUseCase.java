package com.snackbar.cardapio.application.usecases;

import com.snackbar.cardapio.application.dto.CriarAdicionalRequest;
import com.snackbar.cardapio.application.dto.AdicionalDTO;
import com.snackbar.cardapio.application.ports.AdicionalRepositoryPort;
import com.snackbar.cardapio.domain.entities.Adicional;
import com.snackbar.cardapio.domain.valueobjects.Preco;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CriarAdicionalUseCase {

    private final AdicionalRepositoryPort adicionalRepository;

    public AdicionalDTO executar(CriarAdicionalRequest request) {
        Preco preco = Preco.of(request.getPreco());

        Adicional adicional = Adicional.criar(
                request.getNome(),
                request.getDescricao(),
                preco,
                request.getCategoria());

        @SuppressWarnings("null")
        Adicional adicionalSalvo = adicionalRepository.salvar(adicional);

        return AdicionalDTO.de(adicionalSalvo);
    }
}
