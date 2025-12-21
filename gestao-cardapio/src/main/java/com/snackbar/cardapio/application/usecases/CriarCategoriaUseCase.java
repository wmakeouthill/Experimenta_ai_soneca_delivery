package com.snackbar.cardapio.application.usecases;

import com.snackbar.cardapio.application.dto.CategoriaDTO;
import com.snackbar.cardapio.application.dto.CriarCategoriaRequest;
import com.snackbar.cardapio.application.ports.CategoriaRepositoryPort;
import com.snackbar.cardapio.domain.entities.Categoria;
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

