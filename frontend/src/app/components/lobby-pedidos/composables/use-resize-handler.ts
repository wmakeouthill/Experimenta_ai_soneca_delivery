import { PLATFORM_ID, inject, ElementRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

interface ResizeHandlerConfig {
  getListRef: () => ElementRef<HTMLElement> | null;
  isModoGestor: () => boolean;
  onResize: () => void;
}

/**
 * Composable para gerenciar eventos de resize da janela.
 * Responsabilidade única: configurar e limpar event listeners de resize.
 */
export function useResizeHandler(config: ResizeHandlerConfig) {
  const platformId = inject(PLATFORM_ID);
  let resizeHandler: (() => void) | undefined;

  const configurar = () => {
    if (!isPlatformBrowser(platformId)) return;

    const handler = () => {
      const listRef = config.getListRef();
      if (listRef?.nativeElement && !config.isModoGestor()) {
        setTimeout(() => {
          config.onResize();
        }, 100);
      }
    };

    resizeHandler = handler;
    window.addEventListener('resize', handler);
  };

  const limpar = () => {
    if (isPlatformBrowser(platformId) && resizeHandler) {
      window.removeEventListener('resize', resizeHandler);
      resizeHandler = undefined;
    }
  };

  return {
    configurar,
    limpar
  };
}

