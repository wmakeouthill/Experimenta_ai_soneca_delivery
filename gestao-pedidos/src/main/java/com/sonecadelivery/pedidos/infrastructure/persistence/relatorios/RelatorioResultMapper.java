package com.sonecadelivery.pedidos.infrastructure.persistence.relatorios;

import com.sonecadelivery.pedidos.application.dtos.relatorios.CategoriaVendasResumoDTO;
import com.sonecadelivery.pedidos.application.dtos.relatorios.DistribuicaoClientesDTO;
import com.sonecadelivery.pedidos.application.dtos.relatorios.DistribuicaoHorariaDTO;
import com.sonecadelivery.pedidos.application.dtos.relatorios.DistribuicaoMeioPagamentoDTO;
import com.sonecadelivery.pedidos.application.dtos.relatorios.PedidosPorHorarioDTO;
import com.sonecadelivery.pedidos.application.dtos.relatorios.ProdutoMaisVendidoDTO;
import com.sonecadelivery.pedidos.application.dtos.relatorios.QuantidadePorCategoriaDTO;

import java.math.BigDecimal;
import java.util.List;
import java.util.Objects;

final class RelatorioResultMapper {

    private RelatorioResultMapper() {
    }

    static List<CategoriaVendasResumoDTO> categorias(List<?> registros) {
        return registros.stream()
                .map(Object[].class::cast)
                .map(registro -> new CategoriaVendasResumoDTO(
                        Objects.toString(registro[0], "sem_categoria"),
                        Objects.toString(registro[0], "Sem categoria"),
                        toDecimal(registro[1]).doubleValue(),
                        toLong(registro[2])))
                .toList();
    }

    static List<QuantidadePorCategoriaDTO> quantidadePorCategoria(List<?> registros) {
        return registros.stream()
                .map(Object[].class::cast)
                .map(registro -> new QuantidadePorCategoriaDTO(
                        Objects.toString(registro[0], ""),
                        Objects.toString(registro[1], "Sem categoria"),
                        toLong(registro[2])))
                .toList();
    }

    static List<ProdutoMaisVendidoDTO> produtos(List<?> registros) {
        return registros.stream()
                .map(Object[].class::cast)
                .map(registro -> new ProdutoMaisVendidoDTO(
                        Objects.toString(registro[0], ""),
                        Objects.toString(registro[1], "Produto"),
                        toLong(registro[2]),
                        toDecimal(registro[3]).doubleValue()))
                .toList();
    }

    static List<DistribuicaoHorariaDTO> horarios(List<?> registros) {
        return registros.stream()
                .map(Object[].class::cast)
                .map(registro -> new DistribuicaoHorariaDTO(
                        Objects.toString(registro[0], "00"),
                        toDecimal(registro[1]).doubleValue(),
                        toLong(registro[2])))
                .toList();
    }

    static List<PedidosPorHorarioDTO> pedidosPorHorario(List<?> registros) {
        return registros.stream()
                .map(Object[].class::cast)
                .map(registro -> new PedidosPorHorarioDTO(
                        Objects.toString(registro[0], "00"),
                        toLong(registro[1]),
                        toDecimal(registro[2]).doubleValue()))
                .toList();
    }

    static List<DistribuicaoClientesDTO> clientes(List<?> registros) {
        return registros.stream()
                .map(Object[].class::cast)
                .map(registro -> new DistribuicaoClientesDTO(
                        Objects.toString(registro[0], ""),
                        Objects.toString(registro[1], "Cliente"),
                        toDecimal(registro[2]).doubleValue(),
                        toLong(registro[3])))
                .toList();
    }

    static List<DistribuicaoMeioPagamentoDTO> meiosPagamento(List<?> registros) {
        return registros.stream()
                .map(Object[].class::cast)
                .map(registro -> new DistribuicaoMeioPagamentoDTO(
                        Objects.toString(registro[0], "NÃO INFORMADO"),
                        toDecimal(registro[1]).doubleValue(),
                        toLong(registro[2])))
                .toList();
    }

    private static BigDecimal toDecimal(Object valor) {
        if (valor instanceof BigDecimal bigDecimal) {
            return bigDecimal;
        }
        if (valor == null) {
            return BigDecimal.ZERO;
        }
        return new BigDecimal(valor.toString());
    }

    private static long toLong(Object valor) {
        if (valor == null) {
            return 0L;
        }
        return ((Number) valor).longValue();
    }
}
