import { inject } from '@angular/core';
import { signal, computed } from '@angular/core';
import { SessaoTrabalhoService, SessaoTrabalho } from '../../../services/sessao-trabalho.service';
import { paginar, PaginacaoResult } from '../../../utils/paginacao.util';

type EstadoCarregamento = 'idle' | 'carregando' | 'sucesso' | 'erro';

export function useSessoes() {
  const sessaoService = inject(SessaoTrabalhoService);

  // Estados
  const sessoes = signal<SessaoTrabalho[]>([]);
  const estado = signal<EstadoCarregamento>('idle');
  const erro = signal<string | null>(null);

  // Filtros
  const dataFiltro = signal<string | null>(null);
  const pesquisaTexto = signal<string>('');
  const paginaAtual = signal<number>(1);
  const itensPorPagina = signal<number>(7);

  // Computed
  const sessoesFiltradas = computed(() => {
    let resultado = [...sessoes()];

    // Filtro por data
    if (dataFiltro()) {
      const dataFiltroValue = dataFiltro()!;
      resultado = resultado.filter(s => {
        const dataSessao = new Date(s.dataInicio).toISOString().split('T')[0];
        return dataSessao === dataFiltroValue;
      });
    }

    // Filtro por texto (busca em nome, número da sessão)
    if (pesquisaTexto().trim()) {
      const texto = pesquisaTexto().toLowerCase();
      resultado = resultado.filter(s => 
        s.nome.toLowerCase().includes(texto) ||
        s.numeroSessao.toString().includes(texto)
      );
    }

    return resultado;
  });

  const sessoesPaginadas = computed(() => {
    const resultado = sessoesFiltradas();
    return paginar(resultado, itensPorPagina(), paginaAtual());
  });

  const temSessoes = computed(() => sessoes().length > 0);
  const estaCarregando = computed(() => estado() === 'carregando');

  // Métodos
  const carregarSessoes = (dataInicio?: string) => {
    estado.set('carregando');
    erro.set(null);

    sessaoService.listar({ dataInicio }).subscribe({
      next: (sessoesCarregadas) => {
        sessoes.set(sessoesCarregadas);
        estado.set('sucesso');
        paginaAtual.set(1);
      },
      error: (error) => {
        erro.set(error.error?.message || 'Erro ao carregar sessões');
        estado.set('erro');
        sessoes.set([]);
      }
    });
  };

  const filtrarPorData = (data: string | null) => {
    dataFiltro.set(data);
    paginaAtual.set(1);
  };

  const pesquisar = (texto: string) => {
    pesquisaTexto.set(texto);
    paginaAtual.set(1);
  };

  const limparFiltros = () => {
    dataFiltro.set(null);
    pesquisaTexto.set('');
    paginaAtual.set(1);
  };

  const irParaPagina = (pagina: number) => {
    const totalPaginas = sessoesPaginadas().totalPaginas;
    if (pagina >= 1 && pagina <= totalPaginas) {
      paginaAtual.set(pagina);
    }
  };

  return {
    sessoes,
    sessoesFiltradas,
    sessoesPaginadas,
    estado,
    erro,
    temSessoes,
    estaCarregando,
    dataFiltro,
    pesquisaTexto,
    paginaAtual,
    itensPorPagina,
    carregarSessoes,
    filtrarPorData,
    pesquisar,
    limparFiltros,
    irParaPagina
  };
}

