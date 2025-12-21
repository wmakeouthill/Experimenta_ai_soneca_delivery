package com.snackbar.pedidos.infrastructure.web;

import com.snackbar.pedidos.application.dtos.relatorios.CategoriaVendasResumoDTO;
import com.snackbar.pedidos.application.dtos.relatorios.DistribuicaoClientesDTO;
import com.snackbar.pedidos.application.dtos.relatorios.DistribuicaoHorariaDTO;
import com.snackbar.pedidos.application.dtos.relatorios.DistribuicaoMeioPagamentoDTO;
import com.snackbar.pedidos.application.dtos.relatorios.EvolucaoVendasPontoDTO;
import com.snackbar.pedidos.application.dtos.relatorios.FiltroRelatorioTemporalDTO;
import com.snackbar.pedidos.application.dtos.relatorios.GranularidadeTempo;
import com.snackbar.pedidos.application.dtos.relatorios.IndicadoresResumoDTO;
import com.snackbar.pedidos.application.dtos.relatorios.PedidosPorHorarioDTO;
import com.snackbar.pedidos.application.dtos.relatorios.ProdutoMaisVendidoDTO;
import com.snackbar.pedidos.application.dtos.relatorios.QuantidadePorCategoriaDTO;
import com.snackbar.pedidos.application.usecases.relatorios.FiltroRelatorioTemporalFactory;
import com.snackbar.pedidos.application.usecases.relatorios.RelatoriosVendasUseCase;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping(value = "/api/relatorios/vendas", produces = MediaType.APPLICATION_JSON_VALUE)
@RequiredArgsConstructor
public class RelatoriosVendasRestController {

    private final RelatoriosVendasUseCase useCase;
    private final FiltroRelatorioTemporalFactory filtroFactory;

    @GetMapping("/evolucao")
    public List<EvolucaoVendasPontoDTO> evolucao(@RequestParam GranularidadeTempo granularidade,
            @RequestParam("dataReferencia") String dataReferencia,
            @RequestParam(value = "dataFim", required = false) String dataFim) {
        FiltroRelatorioTemporalDTO filtro = filtroFactory.criar(granularidade, dataReferencia, dataFim);
        return useCase.obterEvolucao(filtro);
    }

    @GetMapping("/categorias")
    public List<CategoriaVendasResumoDTO> categorias(@RequestParam GranularidadeTempo granularidade,
            @RequestParam("dataReferencia") String dataReferencia,
            @RequestParam(value = "dataFim", required = false) String dataFim) {
        FiltroRelatorioTemporalDTO filtro = filtroFactory.criar(granularidade, dataReferencia, dataFim);
        return useCase.obterCategorias(filtro);
    }

    @GetMapping("/quantidade-categoria")
    public List<QuantidadePorCategoriaDTO> quantidadeCategoria(@RequestParam GranularidadeTempo granularidade,
            @RequestParam("dataReferencia") String dataReferencia,
            @RequestParam(value = "dataFim", required = false) String dataFim) {
        FiltroRelatorioTemporalDTO filtro = filtroFactory.criar(granularidade, dataReferencia, dataFim);
        return useCase.obterQuantidadePorCategoria(filtro);
    }

    @GetMapping("/top-produtos")
    public List<ProdutoMaisVendidoDTO> topProdutos(@RequestParam GranularidadeTempo granularidade,
            @RequestParam("dataReferencia") String dataReferencia,
            @RequestParam(value = "dataFim", required = false) String dataFim,
            @RequestParam(value = "limite", defaultValue = "15") int limite) {
        FiltroRelatorioTemporalDTO filtro = filtroFactory.criar(granularidade, dataReferencia, dataFim);
        return useCase.obterTopProdutos(filtro, Math.min(Math.max(limite, 1), 50));
    }

    @GetMapping("/horarios")
    public List<DistribuicaoHorariaDTO> horarios(@RequestParam GranularidadeTempo granularidade,
            @RequestParam("dataReferencia") String dataReferencia,
            @RequestParam(value = "dataFim", required = false) String dataFim) {
        FiltroRelatorioTemporalDTO filtro = filtroFactory.criar(granularidade, dataReferencia, dataFim);
        return useCase.obterDistribuicaoHoraria(filtro);
    }

    @GetMapping("/pedidos-horario")
    public List<PedidosPorHorarioDTO> pedidosHorario(@RequestParam GranularidadeTempo granularidade,
            @RequestParam("dataReferencia") String dataReferencia,
            @RequestParam(value = "dataFim", required = false) String dataFim) {
        FiltroRelatorioTemporalDTO filtro = filtroFactory.criar(granularidade, dataReferencia, dataFim);
        return useCase.obterPedidosPorHorario(filtro);
    }

    @GetMapping("/clientes")
    public List<DistribuicaoClientesDTO> clientes(@RequestParam GranularidadeTempo granularidade,
            @RequestParam("dataReferencia") String dataReferencia,
            @RequestParam(value = "dataFim", required = false) String dataFim,
            @RequestParam(value = "limite", defaultValue = "20") int limite) {
        FiltroRelatorioTemporalDTO filtro = filtroFactory.criar(granularidade, dataReferencia, dataFim);
        return useCase.obterClientes(filtro, Math.min(Math.max(limite, 1), 100));
    }

    @GetMapping("/meios-pagamento")
    public List<DistribuicaoMeioPagamentoDTO> meiosPagamento(@RequestParam GranularidadeTempo granularidade,
            @RequestParam("dataReferencia") String dataReferencia,
            @RequestParam(value = "dataFim", required = false) String dataFim) {
        FiltroRelatorioTemporalDTO filtro = filtroFactory.criar(granularidade, dataReferencia, dataFim);
        return useCase.obterMeiosPagamento(filtro);
    }

    @GetMapping("/indicadores")
    public IndicadoresResumoDTO indicadores(@RequestParam GranularidadeTempo granularidade,
            @RequestParam("dataReferencia") String dataReferencia,
            @RequestParam(value = "dataFim", required = false) String dataFim) {
        FiltroRelatorioTemporalDTO filtro = filtroFactory.criar(granularidade, dataReferencia, dataFim);
        return useCase.obterIndicadores(filtro);
    }
}
