package com.sonecadelivery.cardapio.application.usecases;

import com.sonecadelivery.cardapio.application.dto.CategoriaDTO;
import com.sonecadelivery.cardapio.application.dto.CriarCategoriaRequest;
import com.sonecadelivery.cardapio.application.ports.CategoriaRepositoryPort;
import com.sonecadelivery.cardapio.domain.entities.Categoria;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CriarCategoriaUseCase {
    
    private final CategoriaRepositoryPort categoriaRepository;
    
    public CategoriaDTO executar(CriarCategoriaRequest request) {
        Categoria categoria = Categoria.criar(
            request.getNome(),
            request.getDescricao()
        );
        
        @SuppressWarnings("null") // repository.salvar() nunca retorna null
        Categoria categoriaSalva = categoriaRepository.salvar(categoria);
        
        return CategoriaDTO.de(categoriaSalva);
    }
}

