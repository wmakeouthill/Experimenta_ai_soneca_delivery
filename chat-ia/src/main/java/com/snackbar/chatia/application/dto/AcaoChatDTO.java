package com.snackbar.chatia.application.dto;

/**
 * DTO para ações que a IA pode executar em resposta a comandos do usuário.
 * Permite que o chat execute ações como adicionar ao carrinho.
 */
public record AcaoChatDTO(
    TipoAcao tipo,
    String produtoId,
    String produtoNome,
    Integer quantidade,
    String observacao
) {
    
    /**
     * Tipos de ações que o chat pode executar
     */
    public enum TipoAcao {
        /** Adiciona um produto ao carrinho */
        ADICIONAR_CARRINHO,
        
        /** Remove um produto do carrinho */
        REMOVER_CARRINHO,
        
        /** Limpa todo o carrinho */
        LIMPAR_CARRINHO,
        
        /** Mostra o conteúdo do carrinho */
        VER_CARRINHO,
        
        /** Abre os detalhes de um produto */
        VER_DETALHES,
        
        /** Finaliza o pedido */
        FINALIZAR_PEDIDO,
        
        /** Sem ação - apenas resposta de texto */
        NENHUMA
    }
    
    public static AcaoChatDTO adicionarCarrinho(String produtoId, String produtoNome, int quantidade, String observacao) {
        return new AcaoChatDTO(TipoAcao.ADICIONAR_CARRINHO, produtoId, produtoNome, quantidade, observacao);
    }
    
    public static AcaoChatDTO adicionarCarrinho(String produtoId, String produtoNome) {
        return new AcaoChatDTO(TipoAcao.ADICIONAR_CARRINHO, produtoId, produtoNome, 1, null);
    }
    
    public static AcaoChatDTO removerCarrinho(String produtoId, String produtoNome) {
        return new AcaoChatDTO(TipoAcao.REMOVER_CARRINHO, produtoId, produtoNome, null, null);
    }
    
    public static AcaoChatDTO limparCarrinho() {
        return new AcaoChatDTO(TipoAcao.LIMPAR_CARRINHO, null, null, null, null);
    }
    
    public static AcaoChatDTO verCarrinho() {
        return new AcaoChatDTO(TipoAcao.VER_CARRINHO, null, null, null, null);
    }
    
    public static AcaoChatDTO nenhuma() {
        return new AcaoChatDTO(TipoAcao.NENHUMA, null, null, null, null);
    }
    
    public boolean temAcao() {
        return tipo != null && tipo != TipoAcao.NENHUMA;
    }
}
