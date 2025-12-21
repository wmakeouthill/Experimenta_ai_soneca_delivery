package com.snackbar.pedidos.application.dto;

import com.snackbar.pedidos.domain.entities.SessaoTrabalho;
import com.snackbar.pedidos.domain.entities.StatusSessao;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SessaoTrabalhoDTO {
    private String id;
    private Integer numeroSessao;
    private LocalDate dataInicio;
    private LocalDateTime dataInicioCompleta;
    private LocalDateTime dataFim;
    private StatusSessao status;
    private String usuarioId;
    private String nome;
    private BigDecimal valorAbertura;
    private BigDecimal valorFechamento;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    public static SessaoTrabalhoDTO de(SessaoTrabalho sessao) {
        return SessaoTrabalhoDTO.builder()
            .id(sessao.getId())
            .numeroSessao(sessao.getNumeroSessao())
            .dataInicio(sessao.getDataInicio())
            .dataInicioCompleta(sessao.getDataInicioCompleta())
            .dataFim(sessao.getDataFim())
            .status(sessao.getStatus())
            .usuarioId(sessao.getUsuarioId())
            .nome(sessao.obterNome())
            .valorAbertura(sessao.getValorAbertura())
            .valorFechamento(sessao.getValorFechamento())
            .createdAt(sessao.getCreatedAt())
            .updatedAt(sessao.getUpdatedAt())
            .build();
    }
}

