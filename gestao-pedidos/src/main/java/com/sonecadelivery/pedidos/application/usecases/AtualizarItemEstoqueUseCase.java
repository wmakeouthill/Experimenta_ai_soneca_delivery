package com.sonecadelivery.pedidos.application.usecases;

import com.sonecadelivery.kernel.domain.exceptions.ValidationException;
import com.sonecadelivery.pedidos.application.dto.AtualizarItemEstoqueRequest;
import com.sonecadelivery.pedidos.application.dto.ItemEstoqueDTO;
import com.sonecadelivery.pedidos.application.ports.ItemEstoqueRepositoryPort;
import com.sonecadelivery.pedidos.domain.entities.ItemEstoque;
import com.sonecadelivery.pedidos.domain.entities.UnidadeMedida;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * Use case para atualizar um item de estoque existente.
 */
@Service
@RequiredArgsConstructor
public class AtualizarItemEstoqueUseCase {
    
    private final ItemEstoqueRepositoryPort repository;
    
    public ItemEstoqueDTO executar(String id, AtualizarItemEstoqueRequest request) {
        ItemEstoque item = repository.buscarPorId(id)
                .orElseThrow(() -> new ValidationException("Item de estoque não encontrado: " + id));
        
        validarNomeUnico(request.getNome(), id);
        
        UnidadeMedida unidadeMedida = parseUnidadeMedida(request.getUnidadeMedida());
        
        item.atualizar(
                request.getNome(),
                request.getDescricao(),
                request.getQuantidade(),
                request.getQuantidadeMinima(),
                unidadeMedida,
                request.getPrecoUnitario(),
                request.getFornecedor(),
                request.getCodigoBarras()
        );
        
        if (Boolean.TRUE.equals(request.getAtivo())) {
            item.ativar();
        } else {
            item.desativar();
        }
        
        ItemEstoque atualizado = repository.salvar(item);
        return ItemEstoqueDTO.de(atualizado);
    }
    
    private void validarNomeUnico(String nome, String idAtual) {
        if (repository.existePorNomeEIdDiferente(nome.trim(), idAtual)) {
            throw new ValidationException("Já existe outro item com o nome: " + nome);
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

