package com.snackbar.orquestrador.application.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SalvarConfigAnimacaoRequest {
    @NotNull(message = "Status da animação é obrigatório")
    private Boolean animacaoAtivada;
    
    @NotNull(message = "Intervalo da animação é obrigatório")
    @Min(value = 1, message = "Intervalo deve ser maior que zero")
    private Integer intervaloAnimacao;
    
    @NotNull(message = "Duração da animação é obrigatória")
    @Min(value = 1, message = "Duração deve ser maior que zero")
    private Integer duracaoAnimacao;
    
    private String video1Url;
    private String video2Url;
}

