import { computed, signal, inject } from '@angular/core';
import { of, forkJoin } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  CategoriaVendasResumo,
  DistribuicaoClientes,
  DistribuicaoHoraria,
  DistribuicaoMeioPagamento,
  EvolucaoVendasPonto,
  FiltroRelatorioTemporal,
  GranularidadeTempo,
  IndicadoresResumo,
  PedidosPorHorario,
  ProdutoMaisVendido,
  QuantidadePorCategoria
} from '../../../models/relatorios.model';
import { RelatoriosService } from '../../../services/relatorios.service';

type EstadoCarregamento = 'idle' | 'carregando' | 'sucesso' | 'erro';

interface RelatoriosPayload {
  evolucao: EvolucaoVendasPonto[];
  categorias: CategoriaVendasResumo[];
  quantidadePorCategoria: QuantidadePorCategoria[];
  produtos: ProdutoMaisVendido[];
  horarios: DistribuicaoHoraria[];
  pedidosPorHorario: PedidosPorHorario[];
  clientes: DistribuicaoClientes[];
  meiosPagamento: DistribuicaoMeioPagamento[];
  indicadores: IndicadoresResumo;
}

const criarFiltroPadrao = (): FiltroRelatorioTemporal => {
  const agora = new Date();
  const hoje = new Date(Date.UTC(agora.getFullYear(), agora.getMonth(), agora.getDate()));
  return {
    granularidade: 'DIA',
    dataReferencia: hoje.toISOString()
  };
};

const normalizarData = (valor: string): string => {
  const data = new Date(valor);
  data.setUTCHours(0, 0, 0, 0);
  return data.toISOString();
};

export function useRelatorios() {
  const relatoriosService = inject(RelatoriosService);

  const filtro = signal<FiltroRelatorioTemporal>(criarFiltroPadrao());
  const estado = signal<EstadoCarregamento>('idle');
  const erro = signal<string | null>(null);

  const evolucaoVendas = signal<EvolucaoVendasPonto[]>([]);
  const categorias = signal<CategoriaVendasResumo[]>([]);
  const quantidadePorCategoria = signal<QuantidadePorCategoria[]>([]);
  const produtos = signal<ProdutoMaisVendido[]>([]);
  const horarios = signal<DistribuicaoHoraria[]>([]);
  const pedidosPorHorario = signal<PedidosPorHorario[]>([]);
  const clientes = signal<DistribuicaoClientes[]>([]);
  const meiosPagamento = signal<DistribuicaoMeioPagamento[]>([]);
  const indicadores = signal<IndicadoresResumo | null>(null);

  const estaCarregando = computed(() => estado() === 'carregando');
  const possuiDados = computed(() => evolucaoVendas().length > 0 || categorias().length > 0);

  const tratarErro = (error: unknown) => {
    const mensagem = (error as { error?: { message?: string } })?.error?.message
      ?? (error as Error)?.message
      ?? 'Não foi possível carregar os relatórios.';
    erro.set(mensagem);
    estado.set('erro');
    console.error('Erro ao carregar relatórios', error);
    return of<RelatoriosPayload | null>(null);
  };

  const atualizarDados = (payload: RelatoriosPayload | null) => {
    if (!payload) {
      return;
    }

    evolucaoVendas.set(payload.evolucao);
    categorias.set(payload.categorias);
    quantidadePorCategoria.set(payload.quantidadePorCategoria);
    produtos.set(payload.produtos);
    horarios.set(payload.horarios);
    pedidosPorHorario.set(payload.pedidosPorHorario);
    clientes.set(payload.clientes);
    meiosPagamento.set(payload.meiosPagamento);
    indicadores.set(payload.indicadores);
    estado.set('sucesso');
  };

  const construirRequests = (filtroAtual: FiltroRelatorioTemporal) => forkJoin({
    evolucao: relatoriosService.obterEvolucaoVendas(filtroAtual),
    categorias: relatoriosService.obterResumoCategorias(filtroAtual),
    quantidadePorCategoria: relatoriosService.obterQuantidadePorCategoria(filtroAtual),
    produtos: relatoriosService.obterTopProdutos(filtroAtual),
    horarios: relatoriosService.obterDistribuicaoHoraria(filtroAtual),
    pedidosPorHorario: relatoriosService.obterPedidosPorHorario(filtroAtual),
    clientes: relatoriosService.obterDistribuicaoClientes(filtroAtual),
    meiosPagamento: relatoriosService.obterDistribuicaoMeiosPagamento(filtroAtual),
    indicadores: relatoriosService.obterIndicadores(filtroAtual)
  });

  const carregarRelatorios = () => {
    estado.set('carregando');
    erro.set(null);

    construirRequests(filtro())
      .pipe(catchError(tratarErro))
      .subscribe(atualizarDados);
  };

  const alterarGranularidade = (granularidade: GranularidadeTempo) => {
    if (filtro().granularidade === granularidade) {
      return;
    }

    filtro.update(valor => ({
      ...valor,
      granularidade,
      // Limpa dataFim ao mudar granularidade (só faz sentido no modo DIA)
      dataFim: undefined
    }));
    carregarRelatorios();
  };

  const alterarDataReferencia = (data: string) => {
    if (!data) {
      return;
    }

    filtro.update(valor => ({
      ...valor,
      dataReferencia: normalizarData(data)
    }));
    carregarRelatorios();
  };

  const alterarDataFim = (data: string | null) => {
    filtro.update(valor => ({
      ...valor,
      dataFim: data ? normalizarData(data) : undefined
    }));
    carregarRelatorios();
  };

  carregarRelatorios();

  return {
    filtro,
    estado,
    erro,
    evolucaoVendas,
    categorias,
    quantidadePorCategoria,
    produtos,
    horarios,
    pedidosPorHorario,
    clientes,
    meiosPagamento,
    indicadores,
    estaCarregando,
    possuiDados,
    carregarRelatorios,
    alterarGranularidade,
    alterarDataReferencia,
    alterarDataFim
  };
}

