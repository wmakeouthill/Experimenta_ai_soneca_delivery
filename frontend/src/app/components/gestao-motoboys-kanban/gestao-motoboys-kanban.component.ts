import { Component, inject, signal, computed, OnInit, OnDestroy, ChangeDetectionStrategy, PLATFORM_ID, afterNextRender, DestroyRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PedidoService, StatusPedido, Pedido, TipoPedido } from '../../services/pedido.service';
import { MotoboyService, Motoboy } from '../../services/motoboy.service';
import { SessaoTrabalhoService, SessaoTrabalho } from '../../services/sessao-trabalho.service';
import { catchError, of, timer, switchMap } from 'rxjs';

interface PedidosPorStatus {
  pronto: Pedido[];
  saiuParaEntrega: Pedido[];
}

interface MotoboyKanbanColumn {
  motoboy: Motoboy;
  pedidos: Pedido[];
  pedidosPorStatus: PedidosPorStatus;
  valorAPagar: number; // Valor total a pagar ao entregador (R$ 5,00 por entrega)
}

@Component({
  selector: 'app-gestao-motoboys-kanban',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './gestao-motoboys-kanban.component.html',
  styleUrl: './gestao-motoboys-kanban.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GestaoMotoboysKanbanComponent implements OnInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly pedidoService = inject(PedidoService);
  private readonly motoboyService = inject(MotoboyService);
  private readonly sessaoService = inject(SessaoTrabalhoService);
  private readonly destroyRef = inject(DestroyRef);

  readonly StatusPedido = StatusPedido;

  // Valor fixo por entrega (R$ 5,00)
  private readonly VALOR_POR_ENTREGA = 5.0;

  // Estado
  readonly motoboys = signal<Motoboy[]>([]);
  readonly pedidos = signal<Pedido[]>([]);
  readonly sessaoAtiva = signal<SessaoTrabalho | null>(null);
  readonly estaCarregando = signal(false);
  readonly erro = signal<string | null>(null);
  readonly editandoValor = signal<string | null>(null); // ID do pedido sendo editado
  readonly valorEditando = signal<number>(5.0);

  // Computed: Colunas do kanban agrupadas por motoboy
  readonly colunasKanban = computed(() => {
    const motoboysAtivos = this.motoboys().filter(m => m.ativo);
    const pedidosDelivery = this.pedidos().filter(p =>
      p.tipoPedido === TipoPedido.DELIVERY &&
      p.motoboyId &&
      (p.status === StatusPedido.PRONTO || p.status === StatusPedido.SAIU_PARA_ENTREGA)
    );

    return motoboysAtivos.map(motoboy => {
      const pedidosDoMotoboy = pedidosDelivery.filter(p => p.motoboyId === motoboy.id);
      const pedidosPorStatus: PedidosPorStatus = {
        pronto: pedidosDoMotoboy.filter(p => p.status === StatusPedido.PRONTO),
        saiuParaEntrega: pedidosDoMotoboy.filter(p => p.status === StatusPedido.SAIU_PARA_ENTREGA)
      };

      // Calcula o valor a pagar: soma dos valores individuais de cada entrega que saiu para entrega
      const valorAPagar = pedidosPorStatus.saiuParaEntrega.reduce((total, pedido) => {
        const valor = pedido.valorMotoboy || this.VALOR_POR_ENTREGA;
        return total + valor;
      }, 0);

      return {
        motoboy,
        pedidos: pedidosDoMotoboy,
        pedidosPorStatus,
        valorAPagar
      };
    });
  });

  readonly temSessaoAtiva = computed(() => this.sessaoAtiva() !== null);
  readonly totalEntregas = computed(() => this.pedidos().filter(p =>
    p.tipoPedido === TipoPedido.DELIVERY &&
    p.motoboyId &&
    (p.status === StatusPedido.PRONTO || p.status === StatusPedido.SAIU_PARA_ENTREGA)
  ).length);

  constructor() {
    afterNextRender(() => {
      if (!isPlatformBrowser(this.platformId)) return;
      this.carregarSessaoAtiva();
      this.carregarMotoboys();
    });
  }

  ngOnInit(): void {
    // Tudo feito no afterNextRender
  }

  ngOnDestroy(): void {
    // Cleanup automático via takeUntilDestroyed
  }

  carregarSessaoAtiva(): void {
    this.sessaoService.buscarAtiva().subscribe({
      next: (sessao) => {
        this.sessaoAtiva.set(sessao);
        if (sessao) {
          this.carregarPedidos(sessao.id);
          this.iniciarPolling(sessao.id);
        }
      },
      error: (err) => {
        console.error('Erro ao carregar sessão ativa:', err);
        this.erro.set('Erro ao carregar sessão de trabalho');
      }
    });
  }

  carregarMotoboys(): void {
    this.motoboyService.listar(true).subscribe({
      next: (motoboys) => {
        this.motoboys.set(motoboys);
      },
      error: (err) => {
        console.error('Erro ao carregar motoboys:', err);
        this.erro.set('Erro ao carregar motoboys');
      }
    });
  }

  carregarPedidos(sessaoId: string): void {
    this.estaCarregando.set(true);
    this.erro.set(null);

    this.pedidoService.listar({ sessaoId })
      .pipe(
        catchError((err) => {
          console.error('Erro ao carregar pedidos:', err);
          this.erro.set('Erro ao carregar pedidos');
          return of([]);
        })
      )
      .subscribe({
        next: (pedidos) => {
          this.pedidos.set(pedidos);
          this.estaCarregando.set(false);
        },
        error: () => {
          this.estaCarregando.set(false);
        }
      });
  }

  iniciarPolling(sessaoId: string): void {
    timer(0, 5000) // Polling a cada 5 segundos
      .pipe(
        switchMap(() => this.pedidoService.listar({ sessaoId })),
        catchError(() => of([])),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (pedidos) => {
          this.pedidos.set(pedidos);
        }
      });
  }

  atualizarStatusPedido(pedidoId: string, novoStatus: StatusPedido): void {
    this.pedidoService.atualizarStatus(pedidoId, novoStatus).subscribe({
      next: (pedidoAtualizado) => {
        // Atualiza o pedido na lista
        this.pedidos.update(pedidos =>
          pedidos.map(p => p.id === pedidoId ? pedidoAtualizado : p)
        );
      },
      error: (err) => {
        console.error('Erro ao atualizar status:', err);
        this.erro.set('Erro ao atualizar status do pedido');
      }
    });
  }

  marcarComoSaiuParaEntrega(pedido: Pedido): void {
    if (pedido.status === StatusPedido.PRONTO) {
      this.atualizarStatusPedido(pedido.id, StatusPedido.SAIU_PARA_ENTREGA);
    }
  }

  iniciarEdicaoValor(pedido: Pedido): void {
    this.editandoValor.set(pedido.id);
    this.valorEditando.set(pedido.valorMotoboy || this.VALOR_POR_ENTREGA);
  }

  cancelarEdicaoValor(): void {
    this.editandoValor.set(null);
  }

  salvarValorMotoboy(pedido: Pedido): void {
    const novoValor = this.valorEditando();
    if (novoValor < 0) {
      this.erro.set('Valor deve ser maior ou igual a zero');
      return;
    }

    this.pedidoService.atualizarValorMotoboy(pedido.id, novoValor).subscribe({
      next: (pedidoAtualizado) => {
        // Atualiza o pedido na lista
        this.pedidos.update(pedidos =>
          pedidos.map(p => p.id === pedido.id ? pedidoAtualizado : p)
        );
        this.editandoValor.set(null);
        this.erro.set(null);
      },
      error: (err) => {
        console.error('Erro ao atualizar valor do motoboy:', err);
        this.erro.set('Erro ao atualizar valor da entrega');
      }
    });
  }

  obterValorMotoboy(pedido: Pedido): number {
    return pedido.valorMotoboy || this.VALOR_POR_ENTREGA;
  }

  formatarTelefone(telefone?: string): string {
    if (!telefone) {
      return 'Não informado';
    }
    
    // Remove caracteres não numéricos
    const numeros = telefone.replace(/\D/g, '');

    // Formata: (XX) XXXXX-XXXX
    if (numeros.length === 11) {
      return `(${numeros.substring(0, 2)}) ${numeros.substring(2, 7)}-${numeros.substring(7)}`;
    }
    // Formata: (XX) XXXX-XXXX
    if (numeros.length === 10) {
      return `(${numeros.substring(0, 2)}) ${numeros.substring(2, 6)}-${numeros.substring(6)}`;
    }

    return telefone;
  }

  formatarValor(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  }
}

