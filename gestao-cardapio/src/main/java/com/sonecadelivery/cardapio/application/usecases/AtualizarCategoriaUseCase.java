package com.sonecadelivery.cardapio.application.usecases;

import com.sonecadelivery.cardapio.application.dto.AtualizarCategoriaRequest;
import com.sonecadelivery.cardapio.application.dto.CategoriaDTO;
import com.sonecadelivery.cardapio.application.ports.CategoriaRepositoryPort;
import com.sonecadelivery.cardapio.domain.entities.Categoria;
import com.sonecadelivery.kernel.domain.exceptions.ValidationException;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AtualizarCategoriaUseCase {

    private final CategoriaRepositoryPort categoriaRepository;

    public CategoriaDTO executar(@NonNull String id, AtualizarCategoriaRequest request) {
        Categoria categoria = categoriaRepository.buscarPorId(id)
                .orElseThrow(() -> new ValidationException("Categoria não encontrada com ID: " + id));

        if (request.getNome() != null) {
            categoria.atualizarNome(request.getNome());
        }

        if (request.getDescricao() != null) {
            categoria.atualizarDescricao(request.getDescricao());
        }

        if (request.getAtiva() != null) {
            if (request.getAtiva()) {
                categoria.ativar();
            } else {
                categoria.desativar();
            }
        }

        @SuppressWarnings("null") // repository.salvar() nunca retorna null
        Categoria categoriaAtualizada = categoriaRepository.salvar(categoria);

        return CategoriaDTO.de(categoriaAtualizada);
    }
}

