package com.snackbar.pedidos.application.dtos.relatorios;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalUnit;

public enum GranularidadeTempo {
    DIA(ChronoUnit.DAYS, 1, 14),
    SEMANA(ChronoUnit.WEEKS, 1, 8),
    MES(ChronoUnit.MONTHS, 1, 6),
    TRIMESTRE(ChronoUnit.MONTHS, 3, 6),
    SEMESTRE(ChronoUnit.MONTHS, 6, 4),
    ANO(ChronoUnit.YEARS, 1, 5);

    private final TemporalUnit unidadeBase;
    private final int quantidadePasso;
    private final int bucketsPadrao;

    GranularidadeTempo(TemporalUnit unidadeBase, int quantidadePasso, int bucketsPadrao) {
        this.unidadeBase = unidadeBase;
        this.quantidadePasso = quantidadePasso;
        this.bucketsPadrao = bucketsPadrao;
    }

    public LocalDate adicionar(LocalDate data, int multiplicador) {
        return data.plus((long) quantidadePasso * multiplicador, unidadeBase);
    }

    public int bucketsPadrao() {
        return bucketsPadrao;
    }

    public int quantidadePasso() {
        return quantidadePasso;
    }

    public TemporalUnit unidadeBase() {
        return unidadeBase;
    }
}

