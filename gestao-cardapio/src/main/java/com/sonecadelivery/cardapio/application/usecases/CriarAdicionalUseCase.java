package com.sonecadelivery.cardapio.application.usecases;

import com.sonecadelivery.cardapio.application.dto.CriarAdicionalRequest;
import com.sonecadelivery.cardapio.application.dto.AdicionalDTO;
import com.sonecadelivery.cardapio.application.ports.AdicionalRepositoryPort;
import com.sonecadelivery.cardapio.domain.entities.Adicional;
import com.sonecadelivery.cardapio.domain.valueobjects.Preco;
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
