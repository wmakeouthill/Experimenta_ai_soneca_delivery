package com.sonecadelivery.pedidos.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO para representar um item na tabela de caixa.
 * Pode ser uma venda em dinheiro, sangria ou suprimento.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ItemCaixaDTO {
    
    public enum TipoItemCaixa {
        VENDA_DINHEIRO("Venda em Dinheiro"),
        SANGRIA("Sangria"),
        SUPRIMENTO("Suprimento"),
        ABERTURA("Abertura de Caixa"),
        FECHAMENTO("Fechamento de Caixa");
        
        private final String descricao;
        
        TipoItemCaixa(String descricao) {
            this.descricao = descricao;
        }
        
        public String getDescricao() {
            return descricao;
        }
    }
    
    private String id;
    private TipoItemCaixa tipo;
    private String tipoDescricao;
    private LocalDateTime dataHora;
    
    // Dados específicos de venda
    private Integer numeroPedido;
    private String clienteNome;
    
    // Dados específicos de sangria/suprimento
    private String descricao;
    
    // Usuário responsável (ID para mapeamento no frontend)
    private String usuarioId;
    
    private BigDecimal valor;
    
    /**
     * Cria um item de venda em dinheiro a partir de dados do pedido.
     */
    public static ItemCaixaDTO criarVendaDinheiro(
            String pedidoId,
            Integer numeroPedido,
            String clienteNome,
            LocalDateTime dataPedido,
            BigDecimal valorDinheiro,
            String usuarioId
    ) {
        return ItemCaixaDTO.builder()
                .id(pedidoId)
                .tipo(TipoItemCaixa.VENDA_DINHEIRO)
                .tipoDescricao(TipoItemCaixa.VENDA_DINHEIRO.getDescricao())
                .dataHora(dataPedido)
                .numeroPedido(numeroPedido)
                .clienteNome(clienteNome)
                .usuarioId(usuarioId)
                .valor(valorDinheiro)
                .build();
    }
    
    /**
     * Cria um item de sangria.
     */
    public static ItemCaixaDTO criarSangria(
            String id,
            LocalDateTime dataHora,
            String descricao,
            BigDecimal valor,
            String usuarioId
    ) {
        return ItemCaixaDTO.builder()
                .id(id)
                .tipo(TipoItemCaixa.SANGRIA)
                .tipoDescricao(TipoItemCaixa.SANGRIA.getDescricao())
                .dataHora(dataHora)
                .descricao(descricao)
                .usuarioId(usuarioId)
                .valor(valor.negate().abs().negate()) // Garantir que é negativo
                .build();
    }
    
    /**
     * Cria um item de suprimento.
     */
    public static ItemCaixaDTO criarSuprimento(
            String id,
            LocalDateTime dataHora,
            String descricao,
            BigDecimal valor,
            String usuarioId
    ) {
        return ItemCaixaDTO.builder()
                .id(id)
                .tipo(TipoItemCaixa.SUPRIMENTO)
                .tipoDescricao(TipoItemCaixa.SUPRIMENTO.getDescricao())
                .dataHora(dataHora)
                .descricao(descricao)
                .usuarioId(usuarioId)
                .valor(valor.abs()) // Garantir que é positivo
                .build();
    }
}

