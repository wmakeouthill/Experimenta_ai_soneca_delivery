import { signal, computed, inject } from '@angular/core';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { PedidoService, Pedido, MeioPagamento } from '../../../services/pedido.service';
import { SessaoTrabalhoService, SessaoTrabalho } from '../../../services/sessao-trabalho.service';
import { paginar, PaginacaoResult } from '../../../utils/paginacao.util';

type EstadoCarregamento = 'idle' | 'carregando' | 'sucesso' | 'erro';

export interface ResumoFaturamento {
  totalPedidos: number;
  totalFaturamento: number;
  porMeioPagamento: Array<{ meio: MeioPagamento; valor: number }>;
}

export function useHistoricoSessoes() {
  const pedidoService = inject(PedidoService);
  const sessaoService = inject(SessaoTrabalhoService);

  // Estados
  const sessoes = signal<SessaoTrabalho[]>([]);
  const sessaoSelecionada = signal<SessaoTrabalho | null>(null);
  const pedidos = signal<Pedido[]>([]);
  const estado = signal<EstadoCarregamento>('idle');
  const erro = signal<string | null>(null);

  // Filtros e paginação de sessões
  const dataFiltroSessoes = signal<string | null>(null);
  const paginaSessoes = signal<number>(1);
  const itensPorPaginaSessoes = signal<number>(8);

  // Filtros e paginação de pedidos
  const pesquisaPedidos = signal<string>('');
  const paginaPedidos = signal<number>(1);
  const itensPorPaginaPedidos = signal<number>(6);

  // Computed - Sessões
  const sessoesFiltradas = computed(() => {
    let resultado = [...sessoes()];

    // Filtro por data de início
    if (dataFiltroSessoes()) {
      const dataFiltroValue = dataFiltroSessoes()!;
      resultado = resultado.filter(s => {
        const dataSessao = new Date(s.dataInicio).toISOString().split('T')[0];
        return dataSessao === dataFiltroValue;
      });
    }

    return resultado;
  });

  const sessoesPaginadas = computed(() => {
    const resultado = sessoesFiltradas();
    return paginar(resultado, itensPorPaginaSessoes(), paginaSessoes());
  });

  // Computed - Pedidos
  const pedidosFiltrados = computed(() => {
    let resultado = [...pedidos()];

    // Filtro por texto (nome do cliente ou itens)
    if (pesquisaPedidos().trim()) {
      const texto = pesquisaPedidos().toLowerCase();
      resultado = resultado.filter(p => {
        const matchCliente = p.clienteNome.toLowerCase().includes(texto);
        const matchItens = p.itens.some(item => 
          item.produtoNome.toLowerCase().includes(texto)
        );
        return matchCliente || matchItens;
      });
    }

    // Ordenar por número do pedido e depois por data/horário
    resultado.sort((a, b) => {
      // Primeiro ordena por número do pedido (numérico)
      const numeroA = parseInt(a.numeroPedido, 10) || 0;
      const numeroB = parseInt(b.numeroPedido, 10) || 0;
      if (numeroA !== numeroB) {
        return numeroA - numeroB;
      }
      // Se o número for igual, ordena por data/horário
      const dataA = new Date(a.dataPedido).getTime();
      const dataB = new Date(b.dataPedido).getTime();
      return dataA - dataB;
    });

    return resultado;
  });

  const pedidosPaginados = computed(() => {
    const resultado = pedidosFiltrados();
    return paginar(resultado, itensPorPaginaPedidos(), paginaPedidos());
  });

  // Computed - Estados
  const estaCarregando = computed(() => estado() === 'carregando');
  const temSessaoSelecionada = computed(() => sessaoSelecionada() !== null);
  const temPedidos = computed(() => pedidos().length > 0);

  const resumoFaturamento = computed((): ResumoFaturamento => {
    // Usar todos os pedidos (não apenas os filtrados) para o resumo
    const pedidosAtuais = pedidos();
    
    if (pedidosAtuais.length === 0) {
      return {
        totalPedidos: 0,
        totalFaturamento: 0,
        porMeioPagamento: []
      };
    }

    const totalPedidos = pedidosAtuais.length;
    let totalFaturamento = 0;
    const porMeioPagamentoMap = new Map<MeioPagamento, number>();

    pedidosAtuais.forEach(pedido => {
      totalFaturamento += pedido.valorTotal;

      if (pedido.meiosPagamento && pedido.meiosPagamento.length > 0) {
        pedido.meiosPagamento.forEach(mp => {
          const valorAtual = porMeioPagamentoMap.get(mp.meioPagamento) || 0;
          porMeioPagamentoMap.set(mp.meioPagamento, valorAtual + mp.valor);
        });
      }
    });

    const porMeioPagamento = Array.from(porMeioPagamentoMap.entries()).map(([meio, valor]) => ({
      meio,
      valor
    }));

    return {
      totalPedidos,
      totalFaturamento,
      porMeioPagamento
    };
  });

  // Métodos
  const carregarSessoes = () => {
    estado.set('carregando');
    erro.set(null);

    sessaoService.listar()
      .pipe(
        catchError((error) => {
          const mensagem = error.error?.message || error.message || 'Erro ao carregar sessões';
          erro.set(mensagem);
          estado.set('erro');
          console.error('Erro ao carregar sessões:', error);
          return of([]);
        }),
        finalize(() => {
          if (estado() === 'carregando') {
            estado.set('sucesso');
          }
        })
      )
      .subscribe((resultado) => {
        sessoes.set(resultado);
      });
  };

  const selecionarSessao = (sessao: SessaoTrabalho | null) => {
    sessaoSelecionada.set(sessao);
    paginaPedidos.set(1);
    pesquisaPedidos.set('');
    
    if (sessao) {
      carregarPedidosPorSessao(sessao.id);
    } else {
      pedidos.set([]);
    }
  };

  const filtrarSessoesPorData = (data: string | null) => {
    dataFiltroSessoes.set(data);
    paginaSessoes.set(1);
  };

  const irParaPaginaSessoes = (pagina: number) => {
    const totalPaginas = sessoesPaginadas().totalPaginas;
    if (pagina >= 1 && pagina <= totalPaginas) {
      paginaSessoes.set(pagina);
    }
  };

  const pesquisarPedidos = (texto: string) => {
    pesquisaPedidos.set(texto);
    paginaPedidos.set(1);
  };

  const irParaPaginaPedidos = (pagina: number) => {
    const totalPaginas = pedidosPaginados().totalPaginas;
    if (pagina >= 1 && pagina <= totalPaginas) {
      paginaPedidos.set(pagina);
    }
  };

  const carregarPedidosPorSessao = (sessaoId: string) => {
    estado.set('carregando');
    erro.set(null);

    pedidoService.listar({ sessaoId })
      .pipe(
        catchError((error) => {
          const mensagem = error.error?.message || error.message || 'Erro ao carregar pedidos';
          erro.set(mensagem);
          estado.set('erro');
          console.error('Erro ao carregar pedidos:', error);
          return of([]);
        }),
        finalize(() => {
          if (estado() === 'carregando') {
            estado.set('sucesso');
          }
        })
      )
      .subscribe((resultado) => {
        pedidos.set(resultado);
      });
  };

  const recarregar = () => {
    if (sessaoSelecionada()) {
      carregarPedidosPorSessao(sessaoSelecionada()!.id);
    } else {
      carregarSessoes();
    }
  };

  const excluirPedido = (pedidoId: string) => {
    estado.set('carregando');
    erro.set(null);

    pedidoService.excluir(pedidoId)
      .pipe(
        catchError((error) => {
          const mensagem = error.error?.message || error.message || 'Erro ao excluir pedido';
          erro.set(mensagem);
          estado.set('erro');
          console.error('Erro ao excluir pedido:', error);
          return of(null);
        }),
        finalize(() => {
          if (estado() === 'carregando') {
            estado.set('sucesso');
          }
        })
      )
      .subscribe(() => {
        // Recarregar pedidos após exclusão
        if (sessaoSelecionada()) {
          carregarPedidosPorSessao(sessaoSelecionada()!.id);
        }
      });
  };

  return {
    // Estados
    sessoes,
    sessaoSelecionada,
    pedidos,
    estado,
    erro,

    // Filtros e paginação de sessões
    dataFiltroSessoes,
    paginaSessoes,
    sessoesPaginadas,

    // Filtros e paginação de pedidos
    pesquisaPedidos,
    paginaPedidos,
    pedidosPaginados,

    // Computed
    estaCarregando,
    temSessaoSelecionada,
    temPedidos,
    resumoFaturamento,

    // Métodos
    carregarSessoes,
    selecionarSessao,
    carregarPedidosPorSessao,
    recarregar,
    filtrarSessoesPorData,
    irParaPaginaSessoes,
    pesquisarPedidos,
    irParaPaginaPedidos,
    excluirPedido
  };
}

