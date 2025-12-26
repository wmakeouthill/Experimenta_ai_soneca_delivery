package com.sonecadelivery.impressao.application.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO para resposta de formatação de cupom fiscal
 * Retorna os dados formatados em ESC/POS (base64) sem tentar imprimir
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FormatarCupomResponse {
    private boolean sucesso;
    private String mensagem;
    private String dadosEscPosBase64; // Dados do cupom formatados em ESC/POS (base64)
    private String logoBase64; // Logo em base64 (PNG) para impressão separada pelo Electron
    private String tipoImpressora;
    private String pedidoId;
}
