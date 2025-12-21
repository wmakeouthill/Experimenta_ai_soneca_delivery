import { inject, signal, computed } from '@angular/core';
import { GestaoCaixaService, ResumoCaixa, ItemCaixa, RegistrarMovimentacaoRequest } from '../../../services/gestao-caixa.service';
import { SessaoTrabalhoService, SessaoTrabalho } from '../../../services/sessao-trabalho.service';
import { paginar, PaginacaoResult } from '../../../utils/paginacao.util';

type EstadoCaixa = 'inicial' | 'carregando' | 'sucesso' | 'erro';

const ITENS_POR_PAGINA = 10;

export function useGestaoCaixa() {
  const caixaService = inject(GestaoCaixaService);
  const sessaoService = inject(SessaoTrabalhoService);

  const sessoes = signal<SessaoTrabalho[]>([]);
  const sessaoSelecionada = signal<SessaoTrabalho | null>(null);
  const resumoCaixa = signal<ResumoCaixa | null>(null);
  const estado = signal<EstadoCaixa>('inicial');
  const erro = signal<string | null>(null);
  
  // Paginação
  const paginaAtual = signal(1);

  const estaCarregando = computed(() => estado() === 'carregando');
  const temSessaoSelecionada = computed(() => sessaoSelecionada() !== null);
  
  // Itens paginados
  const itensPaginados = computed<PaginacaoResult<ItemCaixa>>(() => {
    const resumo = resumoCaixa();
    if (!resumo || !resumo.itensCaixa) {
      return {
        itens: [],
        totalItens: 0,
        paginaAtual: 1,
        totalPaginas: 0
      };
    }
    
    return paginar(
      resumo.itensCaixa,
      ITENS_POR_PAGINA,
      paginaAtual()
    );
  });

  function carregarSessoes(): void {
    estado.set('carregando');
    erro.set(null);

    sessaoService.listar().subscribe({
      next: (data) => {
        sessoes.set(data);
        estado.set('sucesso');
      },
      error: (err) => {
        estado.set('erro');
        erro.set(err.error?.message || 'Erro ao carregar sessões');
      }
    });
  }

  function selecionarSessao(sessao: SessaoTrabalho | null): void {
    sessaoSelecionada.set(sessao);
    resumoCaixa.set(null);
    paginaAtual.set(1);

    if (sessao) {
      carregarResumoCaixa(sessao.id);
    }
  }

  function carregarResumoCaixa(sessaoId: string): void {
    estado.set('carregando');
    erro.set(null);

    caixaService.buscarResumo(sessaoId).subscribe({
      next: (data) => {
        resumoCaixa.set(data);
        estado.set('sucesso');
      },
      error: (err) => {
        estado.set('erro');
        erro.set(err.error?.message || 'Erro ao carregar resumo do caixa');
      }
    });
  }

  function irParaPagina(pagina: number): void {
    const resumo = resumoCaixa();
    if (!resumo) return;
    
    const totalPaginas = Math.ceil(resumo.totalItens / ITENS_POR_PAGINA);
    if (pagina >= 1 && pagina <= totalPaginas) {
      paginaAtual.set(pagina);
    }
  }

  function registrarSangria(valor: number, descricao?: string): void {
    const sessao = sessaoSelecionada();
    if (!sessao) return;

    const request: RegistrarMovimentacaoRequest = { valor, descricao };

    caixaService.registrarSangria(sessao.id, request).subscribe({
      next: () => {
        carregarResumoCaixa(sessao.id);
      },
      error: (err) => {
        erro.set(err.error?.message || 'Erro ao registrar sangria');
      }
    });
  }

  function registrarSuprimento(valor: number, descricao?: string): void {
    const sessao = sessaoSelecionada();
    if (!sessao) return;

    const request: RegistrarMovimentacaoRequest = { valor, descricao };

    caixaService.registrarSuprimento(sessao.id, request).subscribe({
      next: () => {
        carregarResumoCaixa(sessao.id);
      },
      error: (err) => {
        erro.set(err.error?.message || 'Erro ao registrar suprimento');
      }
    });
  }

  function recarregar(): void {
    carregarSessoes();
    const sessao = sessaoSelecionada();
    if (sessao) {
      carregarResumoCaixa(sessao.id);
    }
  }

  return {
    sessoes,
    sessaoSelecionada,
    resumoCaixa,
    estado,
    erro,
    estaCarregando,
    temSessaoSelecionada,
    itensPaginados,
    paginaAtual,
    carregarSessoes,
    selecionarSessao,
    carregarResumoCaixa,
    irParaPagina,
    registrarSangria,
    registrarSuprimento,
    recarregar
  };
}
