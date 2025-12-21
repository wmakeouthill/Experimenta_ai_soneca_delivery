package com.snackbar.pedidos.application.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MeioPagamentoRequest {
    @NotNull(message = "Meio de pagamento é obrigatório")
    private com.snackbar.pedidos.domain.entities.MeioPagamento meioPagamento;
    
    @NotNull(message = "Valor é obrigatório")
    @Positive(message = "Valor deve ser maior que zero")
    private BigDecimal valor;
}

