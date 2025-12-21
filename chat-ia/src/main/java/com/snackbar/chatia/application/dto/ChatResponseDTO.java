package com.snackbar.chatia.application.dto;

import java.math.BigDecimal;
import java.util.List;

/**
 * DTO para resposta do chat IA.
 * Suporta respostas simples de texto, cards de produtos e ações executáveis.
 */
public record ChatResponseDTO(
    String reply,
    List<ProdutoDestacadoDTO> produtosDestacados,
    AcaoChatDTO acao
) {
    
    /**
     * Produto destacado para exibição como card no chat.
     */
    public record ProdutoDestacadoDTO(
        String id,
        String nome,
        String descricao,
        String categoria,
        BigDecimal preco,
        String imagemUrl,
        boolean disponivel
    ) {}
    
    /**
     * Cria resposta simples apenas com texto.
     */
    public static ChatResponseDTO de(String reply) {
        return new ChatResponseDTO(reply, List.of(), AcaoChatDTO.nenhuma());
    }
    
    /**
     * Cria resposta com texto e produtos destacados.
     */
    public static ChatResponseDTO comProdutos(String reply, List<ProdutoDestacadoDTO> produtos) {
        return new ChatResponseDTO(reply, produtos, AcaoChatDTO.nenhuma());
    }
    
    /**
     * Cria resposta com ação para adicionar ao carrinho.
     */
    public static ChatResponseDTO comAcao(String reply, AcaoChatDTO acao) {
        return new ChatResponseDTO(reply, List.of(), acao);
    }
    
    /**
     * Cria resposta com texto, produtos e ação.
     */
    public static ChatResponseDTO completa(String reply, List<ProdutoDestacadoDTO> produtos, AcaoChatDTO acao) {
        return new ChatResponseDTO(reply, produtos, acao);
    }
    
    /**
     * Cria resposta de erro.
     */
    public static ChatResponseDTO erro(String mensagemErro) {
        return new ChatResponseDTO(mensagemErro, List.of(), AcaoChatDTO.nenhuma());
    }
}
