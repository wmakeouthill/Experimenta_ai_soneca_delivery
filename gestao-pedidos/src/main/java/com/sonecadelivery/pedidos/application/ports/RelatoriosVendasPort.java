package com.sonecadelivery.pedidos.application.ports;

import com.sonecadelivery.pedidos.application.dtos.relatorios.CategoriaVendasResumoDTO;
import com.sonecadelivery.pedidos.application.dtos.relatorios.DistribuicaoClientesDTO;
import com.sonecadelivery.pedidos.application.dtos.relatorios.DistribuicaoHorariaDTO;
import com.sonecadelivery.pedidos.application.dtos.relatorios.DistribuicaoMeioPagamentoDTO;
import com.sonecadelivery.pedidos.application.dtos.relatorios.EvolucaoVendasPontoDTO;
import com.sonecadelivery.pedidos.application.dtos.relatorios.FiltroRelatorioTemporalDTO;
import com.sonecadelivery.pedidos.application.dtos.relatorios.IndicadoresResumoDTO;
import com.sonecadelivery.pedidos.application.dtos.relatorios.PedidosPorHorarioDTO;
import com.sonecadelivery.pedidos.application.dtos.relatorios.ProdutoMaisVendidoDTO;
import com.sonecadelivery.pedidos.application.dtos.relatorios.QuantidadePorCategoriaDTO;

import java.util.List;

public interface RelatoriosVendasPort {
    List<EvolucaoVendasPontoDTO> obterEvolucao(FiltroRelatorioTemporalDTO filtro);

    List<CategoriaVendasResumoDTO> obterCategorias(FiltroRelatorioTemporalDTO filtro);

    List<QuantidadePorCategoriaDTO> obterQuantidadePorCategoria(FiltroRelatorioTemporalDTO filtro);

    List<ProdutoMaisVendidoDTO> obterTopProdutos(FiltroRelatorioTemporalDTO filtro, int limite);

    List<DistribuicaoHorariaDTO> obterDistribuicaoHoraria(FiltroRelatorioTemporalDTO filtro);

    List<PedidosPorHorarioDTO> obterPedidosPorHorario(FiltroRelatorioTemporalDTO filtro);

    List<DistribuicaoClientesDTO> obterClientes(FiltroRelatorioTemporalDTO filtro, int limite);

    List<DistribuicaoMeioPagamentoDTO> obterMeiosPagamento(FiltroRelatorioTemporalDTO filtro);

    IndicadoresResumoDTO obterIndicadores(FiltroRelatorioTemporalDTO filtro);
}
