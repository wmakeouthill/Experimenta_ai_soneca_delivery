import { effect, afterNextRender, PLATFORM_ID, inject, ElementRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

interface PaginationApi {
  calcularItensPorPagina: (ref: ElementRef<HTMLElement>) => void;
  ajustarPagina: (pedidos: any[]) => void;
  iniciarAutoPagina: (getPedidos: () => any[]) => void;
  pararAutoPagina: () => void;
  estaAutoPaginaRodando: () => boolean;
  itensPorPagina: () => number | null;
  getInfoPagina: (pedidos: any[]) => { temPagina: boolean; totalPaginas: number };
}

interface OrderListEffectsConfig {
  platformId: Object;
  getListRef: () => ElementRef<HTMLElement> | null;
  isModoGestor: () => boolean;
  pedidosComAnimacao: () => any[];
  pagination: PaginationApi;
}

/**
 * Composable para gerenciar effects do OrderListComponent.
 * Responsabilidade única: configurar effects de paginação e auto-paginação.
 */
export function useOrderListEffects(config: OrderListEffectsConfig) {
  const platformId = inject(PLATFORM_ID);
  let autoPaginaIniciada = false;

  const deveTerAutoPagina = (): boolean => {
    if (!isPlatformBrowser(config.platformId)) return false;
    if (config.isModoGestor()) return false;

    const pedidos = config.pedidosComAnimacao();
    const itensPorPagina = config.pagination.itensPorPagina();
    const info = config.pagination.getInfoPagina(pedidos);
    const listRef = config.getListRef();

    return info.temPagina && 
           info.totalPaginas > 1 && 
           itensPorPagina !== null && 
           listRef?.nativeElement !== null;
  };

  const iniciarAutoPaginaSeNecessario = () => {
    if (!deveTerAutoPagina()) {
      if (autoPaginaIniciada || config.pagination.estaAutoPaginaRodando()) {
        autoPaginaIniciada = false;
        config.pagination.pararAutoPagina();
      }
      return;
    }

    if (!autoPaginaIniciada && !config.pagination.estaAutoPaginaRodando()) {
      autoPaginaIniciada = true;
      setTimeout(() => {
        const listRef = config.getListRef();
        if (listRef?.nativeElement && !config.pagination.estaAutoPaginaRodando()) {
          config.pagination.iniciarAutoPagina(() => config.pedidosComAnimacao());
        }
      }, 800);
    }
  };

  const configurarEffectRecalculo = () => {
    effect(() => {
      if (!isPlatformBrowser(config.platformId)) return;

      const pedidos = config.pedidosComAnimacao();
      const listRef = config.getListRef();

      if (listRef?.nativeElement && !config.isModoGestor()) {
        setTimeout(() => {
          config.pagination.calcularItensPorPagina(listRef);
          config.pagination.ajustarPagina(pedidos);
        }, 100);
      } else {
        config.pagination.pararAutoPagina();
      }
    });
  };

  const configurarEffectAutoPagina = () => {
    effect(() => {
      if (!isPlatformBrowser(config.platformId)) return;

      const pedidos = config.pedidosComAnimacao();
      const itensPorPagina = config.pagination.itensPorPagina();
      const info = config.pagination.getInfoPagina(pedidos);
      const listRef = config.getListRef();

      const deveTer = !config.isModoGestor() && 
                      info.temPagina && 
                      info.totalPaginas > 1 &&
                      itensPorPagina !== null && 
                      listRef?.nativeElement !== null;

      if (deveTer) {
        if (!autoPaginaIniciada && !config.pagination.estaAutoPaginaRodando()) {
          autoPaginaIniciada = true;
          setTimeout(() => {
            const listRefAtual = config.getListRef();
            if (listRefAtual?.nativeElement && !config.pagination.estaAutoPaginaRodando()) {
              config.pagination.iniciarAutoPagina(() => config.pedidosComAnimacao());
            }
          }, 800);
        }
      } else if (autoPaginaIniciada || config.pagination.estaAutoPaginaRodando()) {
        autoPaginaIniciada = false;
        config.pagination.pararAutoPagina();
      }
    });
  };

  const configurarAfterNextRender = () => {
    afterNextRender(() => {
      if (!isPlatformBrowser(config.platformId)) return;

      setTimeout(() => {
        const pedidos = config.pedidosComAnimacao();
        const itensPorPagina = config.pagination.itensPorPagina();
        const info = config.pagination.getInfoPagina(pedidos);
        const listRef = config.getListRef();

        if (!config.isModoGestor() && 
            info.temPagina && 
            info.totalPaginas > 1 &&
            itensPorPagina !== null && 
            listRef?.nativeElement !== null && 
            !config.pagination.estaAutoPaginaRodando()) {
          autoPaginaIniciada = true;
          config.pagination.iniciarAutoPagina(() => config.pedidosComAnimacao());
        }
      }, 1000);
    });
  };

  const limpar = () => {
    autoPaginaIniciada = false;
    config.pagination.pararAutoPagina();
  };

  return {
    configurarEffectRecalculo,
    configurarEffectAutoPagina,
    configurarAfterNextRender,
    limpar
  };
}

