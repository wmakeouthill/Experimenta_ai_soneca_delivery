import { inject, signal, computed } from '@angular/core';
import { GestaoCaixaService, EstatisticasCaixa, EstatisticaMovimentacao } from '../../../services/gestao-caixa.service';

/**
 * Composable para gerenciar estatísticas de movimentações de caixa.
 * Carrega dados de sangrias e suprimentos para exibição em gráficos.
 */
export function useEstatisticasCaixa() {
  const caixaService = inject(GestaoCaixaService);

  const estatisticas = signal<EstatisticasCaixa | null>(null);
  const carregando = signal(false);
  const erro = signal<string | null>(null);
  const mostrarModal = signal(false);

  /**
   * Sangrias ordenadas por quantidade.
   */
  const sangrias = computed((): EstatisticaMovimentacao[] => {
    return estatisticas()?.sangrias || [];
  });

  /**
   * Suprimentos ordenados por quantidade.
   */
  const suprimentos = computed((): EstatisticaMovimentacao[] => {
    return estatisticas()?.suprimentos || [];
  });

  /**
   * Total de sangrias.
   */
  const totalSangrias = computed(() => {
    return sangrias().reduce((acc, item) => acc + item.quantidade, 0);
  });

  /**
   * Total de suprimentos.
   */
  const totalSuprimentos = computed(() => {
    return suprimentos().reduce((acc, item) => acc + item.quantidade, 0);
  });

  /**
   * Valor total de sangrias.
   */
  const valorTotalSangrias = computed(() => {
    return sangrias().reduce((acc, item) => acc + item.valorTotal, 0);
  });

  /**
   * Valor total de suprimentos.
   */
  const valorTotalSuprimentos = computed(() => {
    return suprimentos().reduce((acc, item) => acc + item.valorTotal, 0);
  });

  /**
   * Maior quantidade entre sangrias para normalização do gráfico.
   */
  const maxQuantidadeSangria = computed(() => {
    const lista = sangrias();
    if (lista.length === 0) return 1;
    return Math.max(...lista.map(item => item.quantidade));
  });

  /**
   * Maior quantidade entre suprimentos para normalização do gráfico.
   */
  const maxQuantidadeSuprimento = computed(() => {
    const lista = suprimentos();
    if (lista.length === 0) return 1;
    return Math.max(...lista.map(item => item.quantidade));
  });

  /**
   * Carrega estatísticas do backend.
   */
  function carregarEstatisticas(): void {
    carregando.set(true);
    erro.set(null);

    caixaService.buscarEstatisticas().subscribe({
      next: (data) => {
        estatisticas.set(data);
        carregando.set(false);
      },
      error: (err) => {
        console.error('[EstatisticasCaixa] Erro ao carregar:', err);
        erro.set('Erro ao carregar estatísticas');
        carregando.set(false);
      }
    });
  }

  /**
   * Abre o modal de estatísticas.
   */
  function abrirModal(): void {
    mostrarModal.set(true);
    carregarEstatisticas();
  }

  /**
   * Fecha o modal de estatísticas.
   */
  function fecharModal(): void {
    mostrarModal.set(false);
  }

  /**
   * Calcula a largura percentual de uma barra no gráfico.
   */
  function calcularLarguraBarra(quantidade: number, max: number): number {
    if (max === 0) return 0;
    return (quantidade / max) * 100;
  }

  return {
    estatisticas,
    carregando,
    erro,
    mostrarModal,
    sangrias,
    suprimentos,
    totalSangrias,
    totalSuprimentos,
    valorTotalSangrias,
    valorTotalSuprimentos,
    maxQuantidadeSangria,
    maxQuantidadeSuprimento,
    carregarEstatisticas,
    abrirModal,
    fecharModal,
    calcularLarguraBarra
  };
}
