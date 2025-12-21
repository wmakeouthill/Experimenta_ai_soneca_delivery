import { computed, signal, inject } from '@angular/core';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { PedidoService, Pedido, MeioPagamento } from '../../../services/pedido.service';
import { paginar, PaginacaoResult } from '../../../utils/paginacao.util';

interface ResumoFinanceiro {
  totalVendas: number;
  totalPedidos: number;
  ticketMedio: number;
  dinheiroNoCaixa: number;
  totalPix: number;
  totalCartao: number;
  totalValeRefeicao: number;
}

interface ResumoPorMeioPagamento {
  meioPagamento: MeioPagamento;
  nome: string;
  valorTotal: number;
  quantidadePedidos: number;
}

type EstadoCarregamento = 'idle' | 'carregando' | 'sucesso' | 'erro';

export function useRelatorioFinanceiro() {
  const pedidoService = inject(PedidoService);

  const dataFiltro = signal<string>(new Date().toISOString().split('T')[0]);
  const estado = signal<EstadoCarregamento>('idle');
  const erro = signal<string | null>(null);
  const pedidos = signal<Pedido[]>([]);
  const paginaAtual = signal<number>(1);
  const itensPorPagina = signal<number>(10);

  const estaCarregando = computed(() => estado() === 'carregando');
  const possuiDados = computed(() => pedidos().length > 0);

  const pedidosOrdenados = computed(() => {
    const pedidosLista = [...pedidos()];
    return pedidosLista.sort((a, b) => {
      const numeroA = parseInt(a.numeroPedido) || 0;
      const numeroB = parseInt(b.numeroPedido) || 0;

      if (numeroA !== numeroB) {
        return numeroA - numeroB;
      }

      const dataA = new Date(a.dataPedido).getTime();
      const dataB = new Date(b.dataPedido).getTime();
      return dataA - dataB;
    });
  });

  const pedidosPaginados = computed<PaginacaoResult<Pedido>>(() => {
    return paginar(
      pedidosOrdenados(),
      itensPorPagina(),
      paginaAtual()
    );
  });

  const resumoFinanceiro = computed<ResumoFinanceiro>(() => {
    const pedidosFiltrados = pedidos();
    if (pedidosFiltrados.length === 0) {
      return {
        totalVendas: 0,
        totalPedidos: 0,
        ticketMedio: 0,
        dinheiroNoCaixa: 0,
        totalPix: 0,
        totalCartao: 0,
        totalValeRefeicao: 0
      };
    }

    const totalVendas = pedidosFiltrados.reduce((acc, p) => acc + p.valorTotal, 0);
    const totalPedidos = pedidosFiltrados.length;
    const ticketMedio = totalPedidos > 0 ? totalVendas / totalPedidos : 0;

    let dinheiroNoCaixa = 0;
    let totalPix = 0;
    let totalCartao = 0;
    let totalValeRefeicao = 0;

    pedidosFiltrados.forEach(pedido => {
      pedido.meiosPagamento?.forEach(mp => {
        switch (mp.meioPagamento) {
          case MeioPagamento.DINHEIRO:
            dinheiroNoCaixa += mp.valor;
            break;
          case MeioPagamento.PIX:
            totalPix += mp.valor;
            break;
          case MeioPagamento.CARTAO_CREDITO:
          case MeioPagamento.CARTAO_DEBITO:
            totalCartao += mp.valor;
            break;
          case MeioPagamento.VALE_REFEICAO:
            totalValeRefeicao += mp.valor;
            break;
        }
      });
    });

    return {
      totalVendas,
      totalPedidos,
      ticketMedio,
      dinheiroNoCaixa,
      totalPix,
      totalCartao,
      totalValeRefeicao
    };
  });

  const resumoPorMeioPagamento = computed<ResumoPorMeioPagamento[]>(() => {
    const pedidosFiltrados = pedidos();
    if (pedidosFiltrados.length === 0) {
      return [];
    }

    const mapa = new Map<MeioPagamento, { valor: number; pedidosIds: Set<string> }>();

    pedidosFiltrados.forEach(pedido => {
      pedido.meiosPagamento?.forEach(mp => {
        const atual = mapa.get(mp.meioPagamento) || { valor: 0, pedidosIds: new Set<string>() };
        atual.valor += mp.valor;
        atual.pedidosIds.add(pedido.id);
        mapa.set(mp.meioPagamento, atual);
      });
    });

    const nomes: Record<MeioPagamento, string> = {
      [MeioPagamento.PIX]: 'PIX',
      [MeioPagamento.CARTAO_CREDITO]: 'Cartão de Crédito',
      [MeioPagamento.CARTAO_DEBITO]: 'Cartão de Débito',
      [MeioPagamento.VALE_REFEICAO]: 'Vale Refeição',
      [MeioPagamento.DINHEIRO]: 'Dinheiro'
    };

    return Array.from(mapa.entries())
      .map(([meio, dados]) => ({
        meioPagamento: meio,
        nome: nomes[meio],
        valorTotal: dados.valor,
        quantidadePedidos: dados.pedidosIds.size
      }))
      .sort((a, b) => b.valorTotal - a.valorTotal);
  });

  const carregarPedidos = () => {
    const data = dataFiltro();
    if (!data) {
      return;
    }

    estado.set('carregando');
    erro.set(null);

    pedidoService
      .listar({
        dataInicioSessao: data
      })
      .pipe(
        catchError(error => {
          const mensagem = (error as { error?: { message?: string } })?.error?.message
            ?? (error as Error)?.message
            ?? 'Não foi possível carregar os pedidos.';
          erro.set(mensagem);
          estado.set('erro');
          console.error('Erro ao carregar pedidos', error);
          return of<Pedido[]>([]);
        }),
        finalize(() => {
          if (estado() === 'carregando') {
            estado.set('sucesso');
          }
        })
      )
      .subscribe(resultado => {
        pedidos.set(resultado);
      });
  };

  const alterarData = (data: string) => {
    if (!data) {
      return;
    }
    dataFiltro.set(data);
    paginaAtual.set(1);
    carregarPedidos();
  };

  const irParaPagina = (pagina: number) => {
    const total = pedidosPaginados().totalPaginas;
    if (pagina >= 1 && pagina <= total) {
      paginaAtual.set(pagina);
    }
  };

  carregarPedidos();

  return {
    dataFiltro,
    estado,
    erro,
    pedidos,
    pedidosOrdenados,
    pedidosPaginados,
    paginaAtual,
    estaCarregando,
    possuiDados,
    resumoFinanceiro,
    resumoPorMeioPagamento,
    carregarPedidos,
    alterarData,
    irParaPagina
  };
}

