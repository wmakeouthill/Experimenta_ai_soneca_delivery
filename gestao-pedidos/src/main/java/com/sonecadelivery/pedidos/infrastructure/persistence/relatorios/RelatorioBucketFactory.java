package com.sonecadelivery.pedidos.infrastructure.persistence.relatorios;

import com.sonecadelivery.pedidos.application.dtos.relatorios.EvolucaoVendasPontoDTO;
import com.sonecadelivery.pedidos.application.dtos.relatorios.FiltroRelatorioTemporalDTO;
import com.sonecadelivery.pedidos.application.dtos.relatorios.GranularidadeTempo;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

final class RelatorioBucketFactory {

    List<RelatorioBucket> criarBuckets(FiltroRelatorioTemporalDTO filtro) {
        List<RelatorioBucket> buckets = new ArrayList<>();
        LocalDate cursor = filtro.inicio();

        while (cursor.isBefore(filtro.fim())) {
            LocalDate proximo = calcularProximoPeriodo(cursor, filtro.granularidade());
            buckets.add(new RelatorioBucket(
                    gerarPeriodoId(cursor, filtro.granularidade()),
                    gerarLabel(cursor, filtro.granularidade()),
                    cursor,
                    proximo));
            cursor = proximo;
        }
        return buckets;
    }

    private LocalDate calcularProximoPeriodo(LocalDate data, GranularidadeTempo granularidade) {
        return switch (granularidade) {
            case DIA -> data.plusDays(1);
            case SEMANA -> calcularProximaSemana(data);
            case MES -> data.plusMonths(1).withDayOfMonth(1);
            case TRIMESTRE -> {
                int trimestreAtual = (data.getMonthValue() - 1) / 3;
                int mesProximoTrimestre = (trimestreAtual + 1) * 3 + 1;
                if (mesProximoTrimestre > 12) {
                    yield LocalDate.of(data.getYear() + 1, 1, 1);
                }
                yield LocalDate.of(data.getYear(), mesProximoTrimestre, 1);
            }
            case SEMESTRE -> {
                if (data.getMonthValue() <= 6) {
                    yield LocalDate.of(data.getYear(), 7, 1);
                } else {
                    yield LocalDate.of(data.getYear() + 1, 1, 1);
                }
            }
            case ANO -> LocalDate.of(data.getYear() + 1, 1, 1);
        };
    }

    private LocalDate calcularProximaSemana(LocalDate data) {
        int diaDaSemana = data.getDayOfWeek().getValue();
        LocalDate inicioSemana = data.minusDays((long) diaDaSemana - 1);
        return inicioSemana.plusWeeks(1);
    }

    void acumular(List<RelatorioBucket> buckets, LocalDate referencia, BigDecimal total, long pedidos) {
        buckets.stream()
                .filter(bucket -> bucket.contem(referencia))
                .findFirst()
                .ifPresent(bucket -> bucket.acumular(total, pedidos));
    }

    RelatorioBucket criarBucketAno(int ano) {
        LocalDate inicioAno = LocalDate.of(ano, 1, 1);
        LocalDate fimAno = LocalDate.of(ano + 1, 1, 1);
        return new RelatorioBucket(
                String.valueOf(ano),
                "Ano " + ano,
                inicioAno,
                fimAno);
    }

    private String gerarPeriodoId(LocalDate data, GranularidadeTempo granularidade) {
        return switch (granularidade) {
            case DIA -> data.toString();
            case SEMANA -> data.getYear() + "-W" + data.get(java.time.temporal.WeekFields.ISO.weekOfWeekBasedYear());
            case MES -> data.getYear() + "-" + String.format("%02d", data.getMonthValue());
            case TRIMESTRE -> data.getYear() + "-T" + ((data.getMonthValue() - 1) / 3 + 1);
            case SEMESTRE -> data.getYear() + "-S" + (data.getMonthValue() <= 6 ? 1 : 2);
            case ANO -> String.valueOf(data.getYear());
        };
    }

    private String gerarLabel(LocalDate data, GranularidadeTempo granularidade) {
        Locale locale = new Locale("pt", "BR");
        return switch (granularidade) {
            case DIA -> data.format(java.time.format.DateTimeFormatter.ofPattern("dd/MM"));
            case SEMANA -> "Sem " + String.format("%02d/%d",
                    data.get(java.time.temporal.WeekFields.ISO.weekOfWeekBasedYear()),
                    data.getYear());
            case MES -> data.getMonth().getDisplayName(TextStyle.SHORT, locale) + "/" + data.getYear();
            case TRIMESTRE -> "T" + ((data.getMonthValue() - 1) / 3 + 1) + "/" + data.getYear();
            case SEMESTRE -> "S" + (data.getMonthValue() <= 6 ? 1 : 2) + "/" + data.getYear();
            case ANO -> "Ano " + data.getYear();
        };
    }

    static final class RelatorioBucket {
        private final String periodoId;
        private final String label;
        private final LocalDate inicio;
        private final LocalDate fim;
        private BigDecimal totalVendas = BigDecimal.ZERO;
        private long totalPedidos = 0L;

        RelatorioBucket(String periodoId, String label, LocalDate inicio, LocalDate fim) {
            this.periodoId = periodoId;
            this.label = label;
            this.inicio = inicio;
            this.fim = fim;
        }

        boolean contem(LocalDate referencia) {
            return (referencia.isEqual(inicio) || referencia.isAfter(inicio)) && referencia.isBefore(fim);
        }

        void acumular(BigDecimal valor, long pedidos) {
            totalVendas = totalVendas.add(Optional.ofNullable(valor).orElse(BigDecimal.ZERO));
            totalPedidos += pedidos;
        }

        EvolucaoVendasPontoDTO toDto() {
            double ticket = totalPedidos == 0 ? 0 : totalVendas.doubleValue() / totalPedidos;
            return new EvolucaoVendasPontoDTO(periodoId, label, totalVendas.doubleValue(), totalPedidos, ticket);
        }
    }
}
