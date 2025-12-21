package com.snackbar.pedidos.application.dtos.relatorios;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

public record FiltroRelatorioTemporalDTO(
        GranularidadeTempo granularidade,
        LocalDate inicio,
        LocalDate fim
) {

    public long diasIntervalo() {
        return ChronoUnit.DAYS.between(inicio, fim);
    }

    public LocalDate inicioPeriodoAnterior() {
        return inicio.minusDays(diasIntervalo());
    }

    public LocalDate fimPeriodoAnterior() {
        return inicio;
    }
}

