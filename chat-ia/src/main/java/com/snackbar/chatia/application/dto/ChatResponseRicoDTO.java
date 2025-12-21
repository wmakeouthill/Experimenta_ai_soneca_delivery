package com.snackbar.chatia.application.dto;

import java.math.BigDecimal;
import java.util.List;

/**
 * DTO de resposta do chat que pode conter texto e/ou cards de produtos.
 * Permite que a IA sugira produtos de forma visual no chat.
 */
public record ChatResponseRicoDTO(
    String reply,
    List<ProdutoCardDTO> produtosDestacados,
    AcaoSugeridaDTO acaoSugerida
) {
    
    /**
     * Card de produto para exibição no chat.
     */
    public record ProdutoCardDTO(
        String id,
        String nome,
        String descricao,
        String categoria,
        BigDecimal preco,
        String imagemUrl,
        boolean disponivel
    ) {}
    
    /**
     * Ação sugerida pela IA (adicionar ao carrinho, ver categoria, etc).
     */
    public record AcaoSugeridaDTO(
        String tipo, // "ADICIONAR_CARRINHO", "VER_CATEGORIA", "VER_PEDIDOS"
        String produtoId,
        String categoriaId,
        String mensagem
    ) {}
    
    /**
     * Cria uma resposta simples apenas com texto.
     */
    public static ChatResponseRicoDTO apenasTexto(String reply) {
        return new ChatResponseRicoDTO(reply, List.of(), null);
    }
    
    /**
     * Cria uma resposta com texto e produtos destacados.
     */
    public static ChatResponseRicoDTO comProdutos(String reply, List<ProdutoCardDTO> produtos) {
        return new ChatResponseRicoDTO(reply, produtos, null);
    }
    
    /**
     * Cria uma resposta de erro.
     */
    public static ChatResponseRicoDTO erro(String mensagem) {
        return new ChatResponseRicoDTO(mensagem, List.of(), null);
    }
}
