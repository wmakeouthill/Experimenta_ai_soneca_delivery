import { inject } from '@angular/core';
import { signal, computed } from '@angular/core';
import { SessaoTrabalhoService, SessaoTrabalho, StatusSessao } from '../../../../../services/sessao-trabalho.service';

/**
 * Composable para gerenciamento de sessão ativa.
 * Centraliza toda a lógica de estado e operações de sessão.
 * Segue Clean Code e Single Responsibility Principle.
 */
export function useSessaoAtiva() {
  const sessaoService = inject(SessaoTrabalhoService);

  // Estados
  const sessaoAtiva = signal<SessaoTrabalho | null>(null);
  const carregando = signal<boolean>(false);
  const erro = signal<string | null>(null);

  // Computed - Validações de ações permitidas
  const temSessaoAtiva = computed(() => sessaoAtiva() !== null);
  
  const podePausar = computed(() => 
    sessaoAtiva()?.status === StatusSessao.ABERTA
  );
  
  const podeRetomar = computed(() => 
    sessaoAtiva()?.status === StatusSessao.PAUSADA
  );
  
  const podeFinalizar = computed(() => {
    const status = sessaoAtiva()?.status;
    return status === StatusSessao.ABERTA || status === StatusSessao.PAUSADA;
  });

  // Métodos de carregamento
  const carregarSessaoAtiva = () => {
    carregando.set(true);
    erro.set(null);

    sessaoService.buscarAtiva().subscribe({
      next: (sessao) => {
        sessaoAtiva.set(sessao);
        carregando.set(false);
      },
      error: (error) => {
        // Apenas erros reais (não 404) chegam aqui
        erro.set('Erro ao carregar sessão ativa');
        carregando.set(false);
      }
    });
  };

  // Métodos de operações
  const iniciar = (usuarioId: string) => {
    carregando.set(true);
    erro.set(null);

    sessaoService.iniciar(usuarioId).subscribe({
      next: (sessao) => {
        sessaoAtiva.set(sessao);
        carregando.set(false);
      },
      error: (error) => {
        erro.set(error.error?.message || 'Erro ao iniciar sessão');
        carregando.set(false);
      }
    });
  };

  const pausar = () => {
    const sessao = sessaoAtiva();
    if (!sessao) return;

    carregando.set(true);
    erro.set(null);

    sessaoService.pausar(sessao.id).subscribe({
      next: (sessaoAtualizada) => {
        sessaoAtiva.set(sessaoAtualizada);
        carregando.set(false);
      },
      error: (error) => {
        erro.set(error.error?.message || 'Erro ao pausar sessão');
        carregando.set(false);
      }
    });
  };

  const retomar = () => {
    const sessao = sessaoAtiva();
    if (!sessao) return;

    carregando.set(true);
    erro.set(null);

    sessaoService.retomar(sessao.id).subscribe({
      next: (sessaoAtualizada) => {
        sessaoAtiva.set(sessaoAtualizada);
        carregando.set(false);
      },
      error: (error) => {
        erro.set(error.error?.message || 'Erro ao retomar sessão');
        carregando.set(false);
      }
    });
  };

  const finalizar = () => {
    const sessao = sessaoAtiva();
    if (!sessao) return;

    carregando.set(true);
    erro.set(null);

    sessaoService.finalizar(sessao.id).subscribe({
      next: () => {
        sessaoAtiva.set(null);
        carregando.set(false);
      },
      error: (error) => {
        erro.set(error.error?.message || 'Erro ao finalizar sessão');
        carregando.set(false);
      }
    });
  };

  return {
    // Estados
    sessaoAtiva,
    carregando,
    erro,
    
    // Computed
    temSessaoAtiva,
    podePausar,
    podeRetomar,
    podeFinalizar,
    
    // Métodos
    carregarSessaoAtiva,
    iniciar,
    pausar,
    retomar,
    finalizar
  };
}

