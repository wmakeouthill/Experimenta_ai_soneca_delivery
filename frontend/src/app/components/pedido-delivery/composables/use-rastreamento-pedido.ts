import { inject, signal, computed, DestroyRef } from '@angular/core';
import { RastreamentoPedidoService, RastreamentoPedidoResponse } from '../../../services/rastreamento-pedido.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

/**
 * Composable para gerenciar rastreamento de pedido.
 * 
 * Performance:
 * - Signals reativos (Angular 20+ Zoneless)
 * - Polling automático quando ativo
 * - Cleanup automático ao destruir componente
 */
export function useRastreamentoPedido(pedidoId: () => string | null | undefined) {
  const rastreamentoService = inject(RastreamentoPedidoService);
  const destroyRef = inject(DestroyRef);
  
  // Estado
  const rastreamento = signal<RastreamentoPedidoResponse | null>(null);
  const carregando = signal(false);
  const erro = signal<string | null>(null);
  const ativo = signal(false);
  
  // Computed
  const podeRastrear = computed(() => {
    const r = rastreamento();
    return r?.permiteRastreamento ?? false;
  });
  
  const temLocalizacaoMotoboy = computed(() => {
    const r = rastreamento();
    return r?.localizacaoMotoboy?.valida ?? false;
  });
  
  const localizacaoMotoboy = computed(() => {
    return rastreamento()?.localizacaoMotoboy ?? null;
  });
  
  const destino = computed(() => {
    const r = rastreamento();
    if (!r) return null;
    return {
      lat: r.latitudeDestino,
      lng: r.longitudeDestino,
      endereco: r.enderecoEntrega
    };
  });
  
  /**
   * Inicia rastreamento com polling.
   */
  function iniciar() {
    const id = pedidoId();
    if (!id || ativo()) {
      return;
    }
    
    ativo.set(true);
    carregando.set(true);
    
    rastreamentoService.iniciarPolling(id, 5000)
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe({
        next: (dados) => {
          rastreamento.set(dados);
          carregando.set(false);
          erro.set(null);
        },
        error: (err) => {
          console.error('Erro ao rastrear pedido:', err);
          erro.set(err.message || 'Erro ao rastrear pedido');
          carregando.set(false);
        }
      });
  }
  
  /**
   * Para rastreamento.
   */
  function parar() {
    ativo.set(false);
    rastreamento.set(null);
    erro.set(null);
  }
  
  /**
   * Carrega dados iniciais uma vez.
   */
  function carregar() {
    const id = pedidoId();
    if (!id || rastreamento()) {
      return;
    }
    
    carregando.set(true);
    rastreamentoService.obterRastreamento(id)
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe({
        next: (dados) => {
          rastreamento.set(dados);
          carregando.set(false);
        },
        error: (err) => {
          console.error('Erro ao carregar rastreamento:', err);
          erro.set(err.message || 'Erro ao carregar rastreamento');
          carregando.set(false);
        }
      });
  }
  
  /**
   * Calcula tempo decorrido desde uma data.
   */
  function calcularTempoDesde(timestamp: string | null | undefined): string {
    if (!timestamp) return '';
    
    const agora = new Date();
    const data = new Date(timestamp);
    const diffMs = agora.getTime() - data.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    
    if (diffMin < 1) return 'agora mesmo';
    if (diffMin === 1) return 'há 1 minuto';
    if (diffMin < 60) return `há ${diffMin} minutos`;
    
    const diffHoras = Math.floor(diffMin / 60);
    if (diffHoras === 1) return 'há 1 hora';
    return `há ${diffHoras} horas`;
  }
  
  return {
    // Estado
    rastreamento,
    carregando,
    erro,
    ativo,
    
    // Computed
    podeRastrear,
    temLocalizacaoMotoboy,
    localizacaoMotoboy,
    destino,
    
    // Métodos
    iniciar,
    parar,
    carregar,
    calcularTempoDesde
  };
}

