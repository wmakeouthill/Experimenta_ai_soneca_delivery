import { signal, computed, inject, effect } from '@angular/core';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { PedidoService, Pedido, StatusPedido } from '../../../services/pedido.service';
import { ProdutoService, Produto } from '../../../services/produto.service';
import { PedidoPollingService } from '../../../services/pedido-polling.service';

type EstadoCarregamento = 'idle' | 'carregando' | 'sucesso' | 'erro';

export function usePedidos() {
  const pedidoService = inject(PedidoService);
  const produtoService = inject(ProdutoService);
  const pollingService = inject(PedidoPollingService);

  // Estados Locais
  // Inicializa com os pedidos já carregados no serviço global
  const pedidos = signal<Pedido[]>(pollingService.pedidos());
  const produtos = signal<Produto[]>([]);
  const estado = signal<EstadoCarregamento>('idle');
  const erro = signal<string | null>(null);

  // Sincroniza pedidos locais com o serviço global
  effect(() => {
    // Força nova referência de array para garantir detecção de mudança
    pedidos.set([...pollingService.pedidos()]);

    // Se recebeu dados (mesmo vazio), atualiza estado para sucesso se não houver erro
    if (estado() !== 'erro') {
      estado.set('sucesso');
    }
  }, { allowSignalWrites: true });

  // Sincroniza erro global
  effect(() => {
    const erroGlobal = pollingService.erro();
    if (erroGlobal) {
      erro.set(erroGlobal);
      estado.set('erro');
    }
  }, { allowSignalWrites: true });

  // Filtros - sempre inicia com PENDENTE (aguardando) selecionado
  const statusSelecionado = signal<StatusPedido>(StatusPedido.PENDENTE);
  const pesquisaTexto = signal<string>('');

  // Computed
  const pedidosFiltrados = computed(() => {
    let resultado = [...pedidos()];

    // Filtro por status (sempre filtra, pois sempre tem um status selecionado)
    resultado = resultado.filter(p => p.status === statusSelecionado());

    // Filtro por texto (busca em número do pedido, nome do cliente)
    if (pesquisaTexto().trim()) {
      const texto = pesquisaTexto().toLowerCase();
      resultado = resultado.filter(p =>
        p.numeroPedido.toLowerCase().includes(texto) ||
        p.clienteNome.toLowerCase().includes(texto)
      );
    }

    return resultado;
  });

  const pedidosPorStatus = computed(() => {
    const todos = pedidos();
    return {
      aguardando: todos.filter(p => p.status === StatusPedido.PENDENTE),
      preparando: todos.filter(p => p.status === StatusPedido.PREPARANDO),
      pronto: todos.filter(p => p.status === StatusPedido.PRONTO),
      finalizado: todos.filter(p => p.status === StatusPedido.FINALIZADO),
      cancelado: todos.filter(p => p.status === StatusPedido.CANCELADO)
    };
  });

  const temPedidos = computed(() => pedidos().length > 0);
  const estaCarregando = computed(() => estado() === 'carregando');

  // Métodos
  const carregarPedidos = (filters?: {
    status?: StatusPedido;
    dataInicio?: string;
    dataFim?: string;
    sessaoId?: string;
  }) => {
    estado.set('carregando');
    erro.set(null);

    // Se for apenas carga inicial ou filtro específico, usa o serviço direto
    // Mas se for para iniciar monitoramento, usa o polling service
    if (filters?.sessaoId) {
      pollingService.iniciarPolling(filters.sessaoId);

      // Força uma recarga imediata para garantir que a tela não fique vazia
      // enquanto aguarda o próximo tick do polling (que pode demorar 5s)
      pollingService.recarregar(filters.sessaoId);

      estado.set('sucesso');
    } else {
      // Fallback para carga única se não tiver sessão (ex: filtros de data)
      pedidoService.listar(filters)
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
    }
  };

  const carregarProdutos = () => {
    produtoService.listar()
      .pipe(
        catchError((error) => {
          console.error('Erro ao carregar produtos:', error);
          return of([]);
        })
      )
      .subscribe((resultado) => {
        produtos.set(resultado);
      });
  };

  const filtrarPorStatus = (status: StatusPedido) => {
    statusSelecionado.set(status);
  };

  const pesquisar = (texto: string) => {
    pesquisaTexto.set(texto);
  };

  const limparFiltros = () => {
    pesquisaTexto.set('');
  };

  const atualizarPedidoNoSignal = (pedidoAtualizado: Pedido) => {
    // Atualiza localmente para feedback imediato
    pedidos.update(lista => {
      const index = lista.findIndex(p => p.id === pedidoAtualizado.id);
      if (index >= 0) {
        const novaLista = [...lista];
        novaLista[index] = { ...pedidoAtualizado };
        return novaLista;
      } else {
        return [...lista, { ...pedidoAtualizado }];
      }
    });

    // Força atualização no serviço global também
    pollingService.recarregar();
  };

  // Mantém compatibilidade com o componente
  const iniciarPolling = (sessaoId?: string) => {
    pollingService.iniciarPolling(sessaoId);
    // Garante que os dados sejam carregados ao entrar na tela,
    // mesmo que o polling já esteja ativo globalmente
    pollingService.recarregar(sessaoId);
  };

  const pararPolling = () => {
    pollingService.pararPolling();
  };

  return {
    // Estados
    pedidos,
    produtos,
    estado,
    erro,
    statusSelecionado,
    pesquisaTexto,
    pollingAtivo: pollingService.pollingAtivo,

    // Observables
    onNovoPedido: pollingService.onNovoPedido,

    // Computed
    pedidosFiltrados,
    pedidosPorStatus,
    temPedidos,
    estaCarregando,

    // Métodos
    carregarPedidos,
    carregarTodosPedidos: carregarPedidos, // Alias
    carregarProdutos,
    filtrarPorStatus,
    pesquisar,
    limparFiltros,
    atualizarPedidoNoSignal,
    iniciarPolling,
    pararPolling
  };
}
