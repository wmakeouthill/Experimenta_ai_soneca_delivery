package com.sonecadelivery.pedidos.application.usecases.relatorios;

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
import com.sonecadelivery.pedidos.application.ports.RelatoriosVendasPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RelatoriosVendasUseCase {

    private final RelatoriosVendasPort relatoriosVendasPort;

    public List<EvolucaoVendasPontoDTO> obterEvolucao(FiltroRelatorioTemporalDTO filtro) {
        return relatoriosVendasPort.obterEvolucao(filtro);
    }

    public List<CategoriaVendasResumoDTO> obterCategorias(FiltroRelatorioTemporalDTO filtro) {
        return relatoriosVendasPort.obterCategorias(filtro);
    }

    public List<QuantidadePorCategoriaDTO> obterQuantidadePorCategoria(FiltroRelatorioTemporalDTO filtro) {
        return relatoriosVendasPort.obterQuantidadePorCategoria(filtro);
    }

    public List<ProdutoMaisVendidoDTO> obterTopProdutos(FiltroRelatorioTemporalDTO filtro, int limite) {
        return relatoriosVendasPort.obterTopProdutos(filtro, limite);
    }

    public List<DistribuicaoHorariaDTO> obterDistribuicaoHoraria(FiltroRelatorioTemporalDTO filtro) {
        return relatoriosVendasPort.obterDistribuicaoHoraria(filtro);
    }

    public List<PedidosPorHorarioDTO> obterPedidosPorHorario(FiltroRelatorioTemporalDTO filtro) {
        return relatoriosVendasPort.obterPedidosPorHorario(filtro);
    }

    public List<DistribuicaoClientesDTO> obterClientes(FiltroRelatorioTemporalDTO filtro, int limite) {
        return relatoriosVendasPort.obterClientes(filtro, limite);
    }

    public List<DistribuicaoMeioPagamentoDTO> obterMeiosPagamento(FiltroRelatorioTemporalDTO filtro) {
        return relatoriosVendasPort.obterMeiosPagamento(filtro);
    }

    public IndicadoresResumoDTO obterIndicadores(FiltroRelatorioTemporalDTO filtro) {
        return relatoriosVendasPort.obterIndicadores(filtro);
    }
}
