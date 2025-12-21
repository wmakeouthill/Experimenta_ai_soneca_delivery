package com.snackbar.pedidos.application.dto;

import com.snackbar.pedidos.domain.entities.MeioPagamentoPedido;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MeioPagamentoDTO {
    private com.snackbar.pedidos.domain.entities.MeioPagamento meioPagamento;
    private BigDecimal valor;
    
    public static MeioPagamentoDTO de(MeioPagamentoPedido meioPagamentoPedido) {
        return MeioPagamentoDTO.builder()
            .meioPagamento(meioPagamentoPedido.getMeioPagamento())
            .valor(meioPagamentoPedido.getValor().getAmount())
            .build();
    }
}

