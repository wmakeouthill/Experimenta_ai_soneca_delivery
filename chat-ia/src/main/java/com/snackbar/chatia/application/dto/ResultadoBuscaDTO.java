package com.snackbar.chatia.application.dto;

import com.snackbar.chatia.application.dto.CardapioContextDTO.ProdutoContextDTO;

import java.util.List;

/**
 * DTO que encapsula o resultado da busca de produtos com contexto.
 * Identifica o TIPO de busca para a IA adaptar sua resposta.
 */
public record ResultadoBuscaDTO(
    TipoBusca tipo,
    String termoBuscado,
    List<ProdutoContextDTO> produtos
) {
    
    /**
     * Tipos de busca identificados
     */
    public enum TipoBusca {
        /** Busca por ingrediente/descrição (ex: "onion ring", "bacon") */
        INGREDIENTE,
        
        /** Busca por categoria (ex: "lanches", "bebidas") */
        CATEGORIA,
        
        /** Busca por nome específico (ex: "x-tudo", "coca-cola") */
        NOME_PRODUTO,
        
        /** Pergunta genérica sobre cardápio (ex: "o que tem?") */
        CARDAPIO_GERAL,
        
        /** Nenhum produto encontrado */
        SEM_RESULTADO
    }
    
    public static ResultadoBuscaDTO porIngrediente(String ingrediente, List<ProdutoContextDTO> produtos) {
        return new ResultadoBuscaDTO(TipoBusca.INGREDIENTE, ingrediente, produtos);
    }
    
    public static ResultadoBuscaDTO porCategoria(String categoria, List<ProdutoContextDTO> produtos) {
        return new ResultadoBuscaDTO(TipoBusca.CATEGORIA, categoria, produtos);
    }
    
    public static ResultadoBuscaDTO porNome(String nome, List<ProdutoContextDTO> produtos) {
        return new ResultadoBuscaDTO(TipoBusca.NOME_PRODUTO, nome, produtos);
    }
    
    public static ResultadoBuscaDTO cardapioGeral(List<ProdutoContextDTO> produtos) {
        return new ResultadoBuscaDTO(TipoBusca.CARDAPIO_GERAL, null, produtos);
    }
    
    public static ResultadoBuscaDTO semResultado(String termoBuscado) {
        return new ResultadoBuscaDTO(TipoBusca.SEM_RESULTADO, termoBuscado, List.of());
    }
    
    public boolean temResultados() {
        return produtos != null && !produtos.isEmpty();
    }
}
