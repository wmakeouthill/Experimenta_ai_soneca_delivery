package com.snackbar.pedidos.application.usecases;

import com.snackbar.kernel.domain.exceptions.ValidationException;
import com.snackbar.pedidos.application.dto.CriarItemEstoqueRequest;
import com.snackbar.pedidos.application.dto.ItemEstoqueDTO;
import com.snackbar.pedidos.application.ports.ItemEstoqueRepositoryPort;
import com.snackbar.pedidos.domain.entities.ItemEstoque;
import com.snackbar.pedidos.domain.entities.UnidadeMedida;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * Use case para criar um novo item de estoque.
 */
@Service
@RequiredArgsConstructor
public class CriarItemEstoqueUseCase {
    
    private final ItemEstoqueRepositoryPort repository;
    
    public ItemEstoqueDTO executar(CriarItemEstoqueRequest request) {
        validarNomeUnico(request.getNome());
        
        UnidadeMedida unidadeMedida = parseUnidadeMedida(request.getUnidadeMedida());
        
        ItemEstoque item = ItemEstoque.criar(
                request.getNome(),
                request.getDescricao(),
                request.getQuantidade(),
                request.getQuantidadeMinima(),
                unidadeMedida,
                request.getPrecoUnitario(),
                request.getFornecedor(),
                request.getCodigoBarras()
        );
        
        ItemEstoque salvo = repository.salvar(item);
        return ItemEstoqueDTO.de(salvo);
    }
    
    private void validarNomeUnico(String nome) {
        if (repository.existePorNome(nome.trim())) {
            throw new ValidationException("Já existe um item com o nome: " + nome);
        }
    }
    
    private UnidadeMedida parseUnidadeMedida(String unidadeMedida) {
        try {
            return UnidadeMedida.valueOf(unidadeMedida.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ValidationException("Unidade de medida inválida: " + unidadeMedida);
        }
    }
}

