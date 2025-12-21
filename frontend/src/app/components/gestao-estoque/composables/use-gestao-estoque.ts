import { inject, signal, computed } from '@angular/core';
import {
  EstoqueService,
  ItemEstoque,
  CriarItemEstoqueRequest,
  AtualizarItemEstoqueRequest
} from '../../../services/estoque.service';

export type EstadoCarregamento = 'idle' | 'carregando' | 'sucesso' | 'erro';

export function useGestaoEstoque() {
  const estoqueService = inject(EstoqueService);

  // Estado
  const itens = signal<ItemEstoque[]>([]);
  const estado = signal<EstadoCarregamento>('idle');
  const erro = signal<string | null>(null);

  // Paginação
  const paginaAtual = signal(0);
  const tamanhoPagina = signal(6);
  const totalElementos = signal(0);
  const totalPaginas = signal(0);

  // Estatísticas
  const estatisticas = signal({
    total: 0,
    ativos: 0,
    inativos: 0,
    semEstoque: 0,
    estoqueBaixo: 0,
    estoqueMedio: 0,
    estoqueAlto: 0,
    estoqueCritico: 0
  });

  // Filtro
  const filtroNome = signal('');
  const apenasAtivos = signal(false);
  const filtroStatus = signal<string | null>(null);

  // Item em edição
  const itemEmEdicao = signal<ItemEstoque | null>(null);
  const modoEdicao = signal(false);

  // Computed
  const estaCarregando = computed(() => estado() === 'carregando');
  const temItens = computed(() => itens().length > 0);

  /**
   * Carrega os itens de estoque.
   */
  function carregarItens(): void {
    estado.set('carregando');
    erro.set(null);

    estoqueService.listar({
      page: paginaAtual(),
      size: tamanhoPagina(),
      sort: 'nome',
      direction: 'asc',
      filtro: filtroNome() || undefined,
      apenasAtivos: apenasAtivos() || undefined
    }).subscribe({
      next: (response) => {
        itens.set(response.content);
        totalElementos.set(response.totalElements);
        totalPaginas.set(response.totalPages);
        calcularEstatisticas(response.content);
        estado.set('sucesso');
      },
      error: (err) => {
        erro.set('Erro ao carregar itens de estoque: ' + (err.error?.message || err.message));
        estado.set('erro');
      }
    });

    // Carregar todos os itens para estatísticas completas
    estoqueService.listar({
      page: 0,
      size: 10000,
      sort: 'nome',
      direction: 'asc'
    }).subscribe({
      next: (response) => {
        calcularEstatisticasCompletas(response.content);
      }
    });
  }

  /**
   * Calcula estatísticas dos itens carregados.
   */
  function calcularEstatisticas(lista: ItemEstoque[]): void {
    // Estatísticas básicas da página atual
  }

  /**
   * Calcula estatísticas completas de todos os itens.
   */
  function calcularEstatisticasCompletas(lista: ItemEstoque[]): void {
    const stats = {
      total: lista.length,
      ativos: 0,
      inativos: 0,
      semEstoque: 0,
      estoqueBaixo: 0,
      estoqueMedio: 0,
      estoqueAlto: 0,
      estoqueCritico: 0
    };

    for (const item of lista) {
      if (item.ativo) {
        stats.ativos++;

        if (item.quantidade === 0) {
          stats.semEstoque++;
        } else if (item.quantidade <= item.quantidadeMinima * 0.5) {
          stats.estoqueCritico++;
        } else if (item.quantidade <= item.quantidadeMinima) {
          stats.estoqueBaixo++;
        } else if (item.quantidade <= item.quantidadeMinima * 2) {
          stats.estoqueMedio++;
        } else {
          stats.estoqueAlto++;
        }
      } else {
        stats.inativos++;
      }
    }

    estatisticas.set(stats);
  }

  /**
   * Filtra itens por status.
   */
  function filtrarPorStatus(status: string | null): void {
    filtroStatus.set(status);
    paginaAtual.set(0);
    carregarItens();
  }

  /**
   * Cria um novo item de estoque.
   */
  function criarItem(request: CriarItemEstoqueRequest): Promise<ItemEstoque> {
    return new Promise((resolve, reject) => {
      estado.set('carregando');

      estoqueService.criar(request).subscribe({
        next: (item) => {
          carregarItens();
          resolve(item);
        },
        error: (err) => {
          const mensagem = err.error?.message || 'Erro ao criar item';
          erro.set(mensagem);
          estado.set('erro');
          reject(mensagem);
        }
      });
    });
  }

  /**
   * Atualiza um item de estoque.
   */
  function atualizarItem(id: string, request: AtualizarItemEstoqueRequest): Promise<ItemEstoque> {
    return new Promise((resolve, reject) => {
      estado.set('carregando');

      estoqueService.atualizar(id, request).subscribe({
        next: (item) => {
          carregarItens();
          limparEdicao();
          resolve(item);
        },
        error: (err) => {
          const mensagem = err.error?.message || 'Erro ao atualizar item';
          erro.set(mensagem);
          estado.set('erro');
          reject(mensagem);
        }
      });
    });
  }

  /**
   * Exclui um item de estoque.
   */
  function excluirItem(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      estado.set('carregando');

      estoqueService.excluir(id).subscribe({
        next: () => {
          carregarItens();
          resolve();
        },
        error: (err) => {
          const mensagem = err.error?.message || 'Erro ao excluir item';
          erro.set(mensagem);
          estado.set('erro');
          reject(mensagem);
        }
      });
    });
  }

  /**
   * Inicia a edição de um item.
   */
  function iniciarEdicao(item: ItemEstoque): void {
    itemEmEdicao.set({ ...item });
    modoEdicao.set(true);
  }

  /**
   * Limpa o estado de edição.
   */
  function limparEdicao(): void {
    itemEmEdicao.set(null);
    modoEdicao.set(false);
  }

  /**
   * Altera a página atual.
   */
  function irParaPagina(pagina: number): void {
    if (pagina >= 0 && pagina < totalPaginas()) {
      paginaAtual.set(pagina);
      carregarItens();
    }
  }

  /**
   * Aplica filtro de busca.
   */
  function aplicarFiltro(filtro: string): void {
    filtroNome.set(filtro);
    paginaAtual.set(0);
    carregarItens();
  }

  /**
   * Alterna filtro de apenas ativos.
   */
  function alternarApenasAtivos(): void {
    apenasAtivos.set(!apenasAtivos());
    paginaAtual.set(0);
    carregarItens();
  }

  /**
   * Recarrega os dados.
   */
  function recarregar(): void {
    carregarItens();
  }

  return {
    // Estado
    itens,
    estado,
    erro,
    estaCarregando,
    temItens,

    // Paginação
    paginaAtual,
    tamanhoPagina,
    totalElementos,
    totalPaginas,

    // Estatísticas
    estatisticas,

    // Filtro
    filtroNome,
    apenasAtivos,
    filtroStatus,
    filtrarPorStatus,

    // Edição
    itemEmEdicao,
    modoEdicao,

    // Ações
    carregarItens,
    criarItem,
    atualizarItem,
    excluirItem,
    iniciarEdicao,
    limparEdicao,
    irParaPagina,
    aplicarFiltro,
    alternarApenasAtivos,
    recarregar
  };
}

