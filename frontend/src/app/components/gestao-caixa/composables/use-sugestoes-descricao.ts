import { inject, signal, computed } from '@angular/core';
import { GestaoCaixaService, DescricaoMovimentacao } from '../../../services/gestao-caixa.service';

const ITENS_POR_PAGINA = 5;
const LIMITE_POPULAR = 3; // Descrições com 3+ usos são consideradas populares

/**
 * Interface estendida com informação de popularidade.
 */
export interface DescricaoComPopularidade {
  descricao: string;
  quantidade: number;
  popular: boolean;
}

/**
 * Composable para gerenciar sugestões de descrições de movimentações.
 * Mantém histórico de descrições anteriores para autocomplete.
 * Ordena por frequência de uso e sinaliza descrições populares.
 */
export function useSugestoesDescricao() {
  const caixaService = inject(GestaoCaixaService);

  const todasDescricoes = signal<DescricaoMovimentacao[]>([]);
  const termoBusca = signal('');
  const paginaAtual = signal(1);
  const mostrarSugestoes = signal(false);
  const carregando = signal(false);

  /**
   * Descrições filtradas pelo termo de busca, com informação de popularidade.
   */
  const descricoesFiltradas = computed((): DescricaoComPopularidade[] => {
    const termo = termoBusca().toLowerCase().trim();
    const todas = todasDescricoes();

    const lista = termo
      ? todas.filter(item =>
        item.descricao.toLowerCase().includes(termo)
      )
      : todas;

    return lista.map(item => ({
      descricao: item.descricao,
      quantidade: item.quantidade,
      popular: item.quantidade >= LIMITE_POPULAR
    }));
  });  /**
   * Total de páginas baseado nas descrições filtradas.
   */
  const totalPaginas = computed(() =>
    Math.ceil(descricoesFiltradas().length / ITENS_POR_PAGINA)
  );

  /**
   * Descrições paginadas para exibição.
   */
  const descricoesPaginadas = computed((): DescricaoComPopularidade[] => {
    const filtradas = descricoesFiltradas();
    const pagina = paginaAtual();
    const inicio = (pagina - 1) * ITENS_POR_PAGINA;
    const fim = inicio + ITENS_POR_PAGINA;

    return filtradas.slice(inicio, fim);
  });

  /**
   * Verifica se há mais páginas disponíveis.
   */
  const temMaisPaginas = computed(() =>
    paginaAtual() < totalPaginas()
  );

  /**
   * Verifica se a descrição digitada já existe.
   */
  const descricaoExiste = computed(() => {
    const termo = termoBusca().toLowerCase().trim();
    if (!termo) return false;

    return todasDescricoes().some(
      item => item.descricao.toLowerCase() === termo
    );
  });

  /**
   * Carrega as descrições do backend (já vem ordenadas por frequência).
   */
  function carregarDescricoes(): void {
    carregando.set(true);
    console.log('[SugestoesDescricao] Iniciando carregamento...');

    caixaService.buscarDescricoesMovimentacao().subscribe({
      next: (descricoes) => {
        console.log('[SugestoesDescricao] Descrições recebidas:', descricoes);
        todasDescricoes.set(descricoes || []);
        carregando.set(false);
      },
      error: (err) => {
        console.error('[SugestoesDescricao] Erro:', err);
        todasDescricoes.set([]);
        carregando.set(false);
      }
    });
  }

  /**
   * Atualiza o termo de busca e reseta a paginação.
   */
  function buscar(termo: string): void {
    termoBusca.set(termo);
    paginaAtual.set(1);
  }

  /**
   * Avança para a próxima página.
   */
  function proximaPagina(): void {
    if (temMaisPaginas()) {
      paginaAtual.set(paginaAtual() + 1);
    }
  }

  /**
   * Volta para a página anterior.
   */
  function paginaAnterior(): void {
    if (paginaAtual() > 1) {
      paginaAtual.set(paginaAtual() - 1);
    }
  }

  /**
   * Abre o dropdown de sugestões.
   */
  function abrirSugestoes(): void {
    mostrarSugestoes.set(true);
    paginaAtual.set(1);
  }

  /**
   * Fecha o dropdown de sugestões.
   */
  function fecharSugestoes(): void {
    mostrarSugestoes.set(false);
    paginaAtual.set(1);
  }

  /**
   * Adiciona nova descrição à lista local (para atualização imediata).
   */
  function adicionarDescricaoLocal(descricao: string): void {
    const descTrimmed = descricao.trim();
    if (!descTrimmed) return;

    const jaExiste = todasDescricoes().some(
      item => item.descricao.toLowerCase() === descTrimmed.toLowerCase()
    );

    if (!jaExiste) {
      // Nova descrição começa com quantidade 1
      todasDescricoes.update(lista => [
        { descricao: descTrimmed, quantidade: 1 },
        ...lista
      ]);
    }
  }

  /**
   * Limpa o estado do composable.
   */
  function resetar(): void {
    termoBusca.set('');
    paginaAtual.set(1);
    mostrarSugestoes.set(false);
  }

  return {
    todasDescricoes,
    termoBusca,
    paginaAtual,
    mostrarSugestoes,
    carregando,
    descricoesFiltradas,
    descricoesPaginadas,
    totalPaginas,
    temMaisPaginas,
    descricaoExiste,
    carregarDescricoes,
    buscar,
    proximaPagina,
    paginaAnterior,
    abrirSugestoes,
    fecharSugestoes,
    adicionarDescricaoLocal,
    resetar
  };
}
