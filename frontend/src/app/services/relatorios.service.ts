import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CategoriaVendasResumo,
  DistribuicaoClientes,
  DistribuicaoHoraria,
  DistribuicaoMeioPagamento,
  EvolucaoVendasPonto,
  FiltroRelatorioTemporal,
  IndicadoresResumo,
  PedidosPorHorario,
  ProdutoMaisVendido,
  QuantidadePorCategoria
} from '../models/relatorios.model';

@Injectable({
  providedIn: 'root'
})
export class RelatoriosService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/relatorios';

  obterEvolucaoVendas(filtro: FiltroRelatorioTemporal): Observable<EvolucaoVendasPonto[]> {
    return this.http.get<EvolucaoVendasPonto[]>(`${this.apiUrl}/vendas/evolucao`, {
      params: this.criarParamsDeTempo(filtro)
    });
  }

  obterResumoCategorias(filtro: FiltroRelatorioTemporal): Observable<CategoriaVendasResumo[]> {
    return this.http.get<CategoriaVendasResumo[]>(`${this.apiUrl}/vendas/categorias`, {
      params: this.criarParamsDeTempo(filtro)
    });
  }

  obterQuantidadePorCategoria(filtro: FiltroRelatorioTemporal): Observable<QuantidadePorCategoria[]> {
    return this.http.get<QuantidadePorCategoria[]>(`${this.apiUrl}/vendas/quantidade-categoria`, {
      params: this.criarParamsDeTempo(filtro)
    });
  }

  obterTopProdutos(filtro: FiltroRelatorioTemporal, limite = 15): Observable<ProdutoMaisVendido[]> {
    const params = this.criarParamsDeTempo(filtro).set('limite', limite);
    return this.http.get<ProdutoMaisVendido[]>(`${this.apiUrl}/vendas/top-produtos`, { params });
  }

  obterDistribuicaoHoraria(filtro: FiltroRelatorioTemporal): Observable<DistribuicaoHoraria[]> {
    return this.http.get<DistribuicaoHoraria[]>(`${this.apiUrl}/vendas/horarios`, {
      params: this.criarParamsDeTempo(filtro)
    });
  }

  obterPedidosPorHorario(filtro: FiltroRelatorioTemporal): Observable<PedidosPorHorario[]> {
    return this.http.get<PedidosPorHorario[]>(`${this.apiUrl}/vendas/pedidos-horario`, {
      params: this.criarParamsDeTempo(filtro)
    });
  }

  obterDistribuicaoClientes(filtro: FiltroRelatorioTemporal, limite = 20): Observable<DistribuicaoClientes[]> {
    const params = this.criarParamsDeTempo(filtro).set('limite', limite);
    return this.http.get<DistribuicaoClientes[]>(`${this.apiUrl}/vendas/clientes`, { params });
  }

  obterDistribuicaoMeiosPagamento(filtro: FiltroRelatorioTemporal): Observable<DistribuicaoMeioPagamento[]> {
    return this.http.get<DistribuicaoMeioPagamento[]>(`${this.apiUrl}/vendas/meios-pagamento`, {
      params: this.criarParamsDeTempo(filtro)
    });
  }

  obterIndicadores(filtro: FiltroRelatorioTemporal): Observable<IndicadoresResumo> {
    return this.http.get<IndicadoresResumo>(`${this.apiUrl}/vendas/indicadores`, {
      params: this.criarParamsDeTempo(filtro)
    });
  }

  private criarParamsDeTempo(filtro: FiltroRelatorioTemporal): HttpParams {
    let params = new HttpParams().set('granularidade', filtro.granularidade);
    params = params.set('dataReferencia', filtro.dataReferencia);
    if (filtro.dataFim) {
      params = params.set('dataFim', filtro.dataFim);
    }
    return params;
  }
}

