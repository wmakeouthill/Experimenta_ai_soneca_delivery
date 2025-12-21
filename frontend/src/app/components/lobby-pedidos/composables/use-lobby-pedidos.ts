import { inject, signal, computed } from '@angular/core';
import { PedidoService, Pedido, StatusPedido } from '../../../services/pedido.service';
import { SessaoTrabalhoService } from '../../../services/sessao-trabalho.service';

export function useLobbyPedidos() {
  const pedidoService = inject(PedidoService);
  const sessaoService = inject(SessaoTrabalhoService);

  const pedidos = signal<Pedido[]>([]);
  const loading = signal(false);
  const error = signal<string | null>(null);
  const sessaoAtiva = signal<any>(null);

  const pedidosPreparando = computed(() => 
    pedidos().filter(p => p.status === StatusPedido.PREPARANDO)
  );

  const pedidosPronto = computed(() => 
    pedidos().filter(p => p.status === StatusPedido.PRONTO)
  );

  const carregarSessaoAtiva = () => {
    sessaoService.buscarAtiva().subscribe({
      next: (sessao) => sessaoAtiva.set(sessao),
      error: (err) => console.error('Erro ao carregar sessão ativa:', err)
    });
  };

  const carregarPedidos = () => {
    loading.set(true);
    error.set(null);

    const sessao = sessaoAtiva();
    if (!sessao) {
      pedidos.set([]);
      loading.set(false);
      return;
    }

    pedidoService.listar({ sessaoId: sessao.id }).subscribe({
      next: (lista) => {
        const pedidosFiltrados = lista.filter(
          p => p.status === StatusPedido.PREPARANDO || p.status === StatusPedido.PRONTO
        );
        pedidos.set(pedidosFiltrados);
      },
      error: (err) => {
        console.error('Erro ao carregar pedidos:', err);
        error.set('Erro ao carregar pedidos');
        loading.set(false);
      },
      complete: () => loading.set(false)
    });
  };


  return {
    pedidos,
    pedidosPreparando,
    pedidosPronto,
    loading,
    error,
    sessaoAtiva,
    carregarSessaoAtiva,
    carregarPedidos
  };
}

