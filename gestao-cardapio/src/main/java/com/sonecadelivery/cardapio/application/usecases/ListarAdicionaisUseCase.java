package com.sonecadelivery.cardapio.application.usecases;

import com.sonecadelivery.cardapio.application.dto.AdicionalDTO;
import com.sonecadelivery.cardapio.application.ports.AdicionalRepositoryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ListarAdicionaisUseCase {

    private final AdicionalRepositoryPort adicionalRepository;

    public List<AdicionalDTO> executar(boolean apenasDisponiveis) {
        var adicionais = apenasDisponiveis
                ? adicionalRepository.buscarDisponiveis()
                : adicionalRepository.buscarTodos();

        return adicionais.stream()
                .map(AdicionalDTO::de)
                .toList();
    }

    public List<AdicionalDTO> executarPorCategoria(String categoria) {
        return adicionalRepository.buscarPorCategoria(categoria).stream()
                .map(AdicionalDTO::de)
                .toList();
    }
}
