import { effect, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Composable dedicado para gerenciar auto-paginação.
 * Responsabilidade única: controlar a transição automática entre páginas.
 */
export function useAutoPagination(
  temPaginas: () => boolean,
  totalPaginas: () => number,
  paginaAtual: () => number,
  avancarPagina: () => void,
  intervaloMs: number = 5000
) {
  const platformId = inject(PLATFORM_ID);
  let intervalId: any = null;

  const iniciar = () => {
    parar();

    if (!isPlatformBrowser(platformId)) return;
    if (!temPaginas()) return;

    intervalId = setInterval(() => {
      if (temPaginas() && totalPaginas() > 1) {
        avancarPagina();
      } else {
        parar();
      }
    }, intervaloMs);
  };

  const parar = () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };

  const reiniciar = () => {
    parar();
    if (isPlatformBrowser(platformId) && temPaginas()) {
      setTimeout(() => iniciar(), 100);
    }
  };

  return {
    iniciar,
    parar,
    reiniciar
  };
}

