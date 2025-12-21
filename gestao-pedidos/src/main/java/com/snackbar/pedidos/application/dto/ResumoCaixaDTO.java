package com.snackbar.pedidos.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * DTO com o resumo do caixa de uma sessão.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResumoCaixaDTO {
    private String sessaoId;
    private String nomeSessao;
    private BigDecimal valorAbertura;
    private BigDecimal totalVendasDinheiro;
    private int quantidadeVendasDinheiro;
    private BigDecimal totalSangrias;
    private BigDecimal totalSuprimentos;
    private BigDecimal saldoEsperado;
    private BigDecimal valorFechamento;
    private BigDecimal diferenca;
    
    // Diferenças para o header
    private BigDecimal diferencaGlobal;
    private BigDecimal diferencaSessaoAnterior;
    private String nomeSessaoAnterior;
    
    // Lista unificada de itens do caixa (vendas em dinheiro + sangrias + suprimentos)
    private List<ItemCaixaDTO> itensCaixa;
    private int totalItens;
}

