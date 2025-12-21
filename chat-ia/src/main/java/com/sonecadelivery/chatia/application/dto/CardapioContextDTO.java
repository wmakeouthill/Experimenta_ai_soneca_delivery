package com.sonecadelivery.chatia.application.dto;

import java.math.BigDecimal;
import java.util.List;

/**
 * DTO com contexto do cardápio para a IA.
 * Contém todas as informações necessárias para a IA responder sobre o cardápio.
 */
public record CardapioContextDTO(
    List<CategoriaContextDTO> categorias,
    List<ProdutoContextDTO> produtos,
    String resumoCardapio
) {
    
    /**
     * Categoria do cardápio.
     */
    public record CategoriaContextDTO(
        String id,
        String nome,
        String descricao,
        int ordem
    ) {}
    
    /**
     * Produto do cardápio com todas as informações relevantes.
     */
    public record ProdutoContextDTO(
        String id,
        String nome,
        String descricao,
        String categoria,
        BigDecimal preco,
        String imagemUrl,
        boolean disponivel,
        List<String> ingredientes,
        List<String> alergenos,
        boolean vegetariano,
        boolean vegano
    ) {}
    
    /**
     * Gera uma descrição textual do cardápio para o system prompt da IA.
     * Formato otimizado para que a IA entenda que SOMENTE estes produtos existem.
     */
    public String gerarDescricaoParaIA() {
        StringBuilder sb = new StringBuilder();
        
        // Cabeçalho enfático
        sb.append("╔══════════════════════════════════════════════════════════════════╗\n");
        sb.append("║              CARDÁPIO OFICIAL - LISTA COMPLETA                   ║\n");
        sb.append("║    ESTES SÃO OS ÚNICOS PRODUTOS QUE EXISTEM NO ESTABELECIMENTO   ║\n");
        sb.append("╚══════════════════════════════════════════════════════════════════╝\n\n");
        
        if (resumoCardapio != null && !resumoCardapio.isBlank()) {
            sb.append("📋 ").append(resumoCardapio).append("\n\n");
        }
        
        int totalProdutos = 0;
        
        // Agrupa produtos por categoria
        for (CategoriaContextDTO categoria : categorias) {
            List<ProdutoContextDTO> produtosCategoria = produtos.stream()
                .filter(p -> p.categoria().equals(categoria.nome()) && p.disponivel())
                .toList();
            
            if (produtosCategoria.isEmpty()) continue;
            
            sb.append("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
            sb.append("📁 CATEGORIA: ").append(categoria.nome().toUpperCase()).append("\n");
            if (categoria.descricao() != null && !categoria.descricao().isBlank()) {
                sb.append("   ").append(categoria.descricao()).append("\n");
            }
            sb.append("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
            
            for (ProdutoContextDTO produto : produtosCategoria) {
                totalProdutos++;
                sb.append("\n  🔹 PRODUTO: ").append(produto.nome()).append("\n");
                sb.append("     💰 PREÇO: R$ ").append(String.format("%.2f", produto.preco())).append("\n");
                
                if (produto.descricao() != null && !produto.descricao().isBlank()) {
                    sb.append("     📝 Descrição: ").append(produto.descricao()).append("\n");
                }
                
                List<String> tags = new java.util.ArrayList<>();
                if (produto.vegetariano()) tags.add("🥬 Vegetariano");
                if (produto.vegano()) tags.add("🌱 Vegano");
                if (!tags.isEmpty()) {
                    sb.append("     ").append(String.join(" | ", tags)).append("\n");
                }
            }
            sb.append("\n");
        }
        
        // Rodapé enfático
        sb.append("╔══════════════════════════════════════════════════════════════════╗\n");
        sb.append("║                    FIM DO CARDÁPIO                               ║\n");
        sb.append("║    Total de produtos disponíveis: ").append(String.format("%-3d", totalProdutos)).append("                           ║\n");
        sb.append("╠══════════════════════════════════════════════════════════════════╣\n");
        sb.append("║  ⚠️ ATENÇÃO: Qualquer produto NÃO listado acima NÃO EXISTE!     ║\n");
        sb.append("║  Use APENAS os nomes e preços EXATOS desta lista.               ║\n");
        sb.append("╚══════════════════════════════════════════════════════════════════╝\n");
        
        return sb.toString();
    }
}
