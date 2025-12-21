package com.snackbar.impressao.application.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImprimirCupomResponse {
    private boolean sucesso;
    private String mensagem;
    private LocalDateTime dataImpressao;
    private String pedidoId;
}

