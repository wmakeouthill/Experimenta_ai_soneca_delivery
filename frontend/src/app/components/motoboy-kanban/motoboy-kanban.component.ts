import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy, PLATFORM_ID, afterNextRender, DestroyRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PedidoService, StatusPedido, Pedido, TipoPedido } from '../../services/pedido.service';
import { MotoboyAuthService, MotoboyAuth } from '../../services/motoboy-auth.service';
import { catchError, of, timer, switchMap } from 'rxjs';
import { HttpClient } from '@angular/common/http';

interface PedidosPorStatus {
  pronto: Pedido[];
  saiuParaEntrega: Pedido[];
}

@Component({
  selector: 'app-motoboy-kanban',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './motoboy-kanban.component.html',
  styleUrl: './motoboy-kanban.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MotoboyKanbanComponent implements OnInit {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly http = inject(HttpClient);
  private readonly pedidoService = inject(PedidoService);
  private readonly motoboyAuthService = inject(MotoboyAuthService);
  private readonly destroyRef = inject(DestroyRef);

  readonly StatusPedido = StatusPedido;

  // Estado
  readonly motoboy = signal<MotoboyAuth | null>(null);
  readonly pedidos = signal<Pedido[]>([]);
  readonly estaCarregando = signal(false);
  readonly erro = signal<string | null>(null);

  // Computed: Pedidos agrupados por status
  // Ordena: SAIU_PARA_ENTREGA primeiro (em trânsito), depois PRONTO
  readonly pedidosPorStatus = computed(() => {
    const pedidosDelivery = this.pedidos().filter(p =>
      p.tipoPedido === TipoPedido.DELIVERY &&
      (p.status === StatusPedido.PRONTO || p.status === StatusPedido.SAIU_PARA_ENTREGA)
    );

    // Ordena por status: SAIU_PARA_ENTREGA primeiro, depois PRONTO
    const saiuParaEntrega = pedidosDelivery
      .filter(p => p.status === StatusPedido.SAIU_PARA_ENTREGA)
      .sort((a, b) => {
        // Ordena por data de criação (mais recentes primeiro)
        const dataA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dataB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dataB - dataA;
      });
    
    const pronto = pedidosDelivery
      .filter(p => p.status === StatusPedido.PRONTO)
      .sort((a, b) => {
        // Ordena por data de criação (mais recentes primeiro)
        const dataA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dataB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dataB - dataA;
      });

    return {
      saiuParaEntrega,
      pronto
    };
  });

  readonly totalEntregas = computed(() => this.pedidos().filter(p =>
    p.tipoPedido === TipoPedido.DELIVERY &&
    (p.status === StatusPedido.PRONTO || p.status === StatusPedido.SAIU_PARA_ENTREGA)
  ).length);

  constructor() {
    afterNextRender(() => {
      if (!isPlatformBrowser(this.platformId)) return;
      
      // Verifica autenticação antes de carregar dados
      // Aguarda um pouco para garantir que o sessionStorage foi carregado
      setTimeout(() => {
        if (!this.motoboyAuthService.isAuthenticated()) {
          console.warn('⚠️ Motoboy não autenticado. Redirecionando para login...', {
            temToken: !!this.motoboyAuthService.getToken(),
            temMotoboy: !!this.motoboyAuthService.motoboyLogado
          });
          window.location.href = '/cadastro-motoboy';
          return;
        }
        
        this.carregarMotoboy();
        this.carregarPedidos();
      }, 100);
    });
  }

  ngOnInit(): void {
    // Tudo feito no afterNextRender
  }

  carregarMotoboy(): void {
    const motoboyLogado = this.motoboyAuthService.motoboyLogado;
    if (motoboyLogado) {
      this.motoboy.set(motoboyLogado);
    } else {
      // Se não há motoboy logado no sessionStorage, tenta buscar do backend
      // Isso pode acontecer se o sessionStorage foi limpo mas o token ainda é válido
      this.http.get<MotoboyAuth>('/api/motoboy/me')
        .pipe(
          catchError((err) => {
            console.error('Erro ao carregar dados do motoboy:', err);
            // Se der erro 401 ou 404, redireciona para login
            if (err.status === 401 || err.status === 404) {
              this.motoboyAuthService.logout();
              window.location.href = '/cadastro-motoboy';
            } else {
              this.erro.set('Erro ao carregar dados do motoboy');
            }
            return of(null);
          })
        )
        .subscribe({
          next: (motoboy) => {
            if (motoboy) {
              this.motoboy.set(motoboy);
              // Salva no sessionStorage para próxima vez
              if (typeof sessionStorage !== 'undefined') {
                sessionStorage.setItem('motoboy-auth-data', JSON.stringify(motoboy));
              }
            }
          }
        });
    }
  }

  carregarPedidos(): void {
    this.estaCarregando.set(true);
    this.erro.set(null);

    this.http.get<Pedido[]>('/api/motoboy/pedidos')
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
          this.iniciarPolling();
        },
        error: () => {
          this.estaCarregando.set(false);
        }
      });
  }

  iniciarPolling(): void {
    timer(5000, 10000) // Polling a cada 10 segundos (primeira chamada após 5s)
      .pipe(
        switchMap(() => this.http.get<Pedido[]>('/api/motoboy/pedidos')),
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

  formatarTelefone(telefone: string): string {
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

  logout(): void {
    this.motoboyAuthService.logout();
    window.location.href = '/cadastro-motoboy';
  }
}

