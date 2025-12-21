import { signal } from '@angular/core';
import { Pedido, StatusPedido } from '../../../services/pedido.service';

interface AnimationConfig {
  animacaoAtivada: boolean;
  intervaloAnimacao: number;
  duracaoAnimacao: number;
  video1Url?: string | null;
  video2Url?: string | null;
}

export function useAnimations() {
  const isAnimating = signal(false);
  const pedidoAnimando = signal<string | null>(null);
  const pedidoAnimandoDados = signal<Pedido | null>(null);
  const pedidoAnimandoStatus = signal<StatusPedido | null>(null);

  const animacaoConfig = signal<AnimationConfig>({
    animacaoAtivada: true,
    intervaloAnimacao: 30,
    duracaoAnimacao: 6,
    video1Url: null,
    video2Url: null
  });

  const detectarMudancaStatus = (
    pedidosAtuais: Pedido[],
    pedidosAnteriores: Pedido[]
  ): { pedido: Pedido; statusAnterior: StatusPedido } | null => {
    for (const pedidoAtual of pedidosAtuais) {
      const pedidoAnterior = pedidosAnteriores.find(p => p.id === pedidoAtual.id);

      if (pedidoAnterior && pedidoAnterior.status !== pedidoAtual.status) {
        return {
          pedido: pedidoAtual,
          statusAnterior: pedidoAnterior.status
        };
      }
    }
    return null;
  };

  const animarTransicaoStatus = (
    pedido: Pedido,
    statusAnterior: StatusPedido,
    duracao: number
  ) => {
    pedidoAnimando.set(pedido.id);
    pedidoAnimandoDados.set({ ...pedido, status: statusAnterior });
    pedidoAnimandoStatus.set(statusAnterior);
    isAnimating.set(true);

    setTimeout(() => {
      pedidoAnimandoStatus.set(pedido.status);
      pedidoAnimandoDados.set(pedido);
    }, 500);

    setTimeout(() => {
      pedidoAnimando.set(null);
      pedidoAnimandoDados.set(null);
      pedidoAnimandoStatus.set(null);
      isAnimating.set(false);
    }, duracao * 1000);
  };

  const iniciarAnimacaoPeriodica = (
    pedidosAtuais: Pedido[],
    pedidosAnteriores: Pedido[],
    callback: () => void
  ) => {
    const config = animacaoConfig();
    if (!config.animacaoAtivada) return;

    const mudanca = detectarMudancaStatus(pedidosAtuais, pedidosAnteriores);
    if (mudanca) {
      animarTransicaoStatus(
        mudanca.pedido,
        mudanca.statusAnterior,
        config.duracaoAnimacao
      );
      callback();
    }
  };

  const animarGlobal = (duracao: number) => {
    // Anima apenas a tela fullscreen, sem precisar de pedido
    isAnimating.set(true);
    
    setTimeout(() => {
      isAnimating.set(false);
    }, duracao * 1000);
  };

  return {
    isAnimating,
    pedidoAnimando,
    pedidoAnimandoDados,
    pedidoAnimandoStatus,
    animacaoConfig,
    detectarMudancaStatus,
    animarTransicaoStatus,
    iniciarAnimacaoPeriodica,
    animarGlobal
  };
}

