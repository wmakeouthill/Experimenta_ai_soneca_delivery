import { Component, OnInit, OnDestroy, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { FilaPedidosMesaService, PedidoPendente, AceitarPedidoDeliveryRequest } from '../../services/fila-pedidos-mesa.service';
import { MotoboyService, Motoboy } from '../../services/motoboy.service';

@Component({
    selector: 'app-fila-pedidos-mesa',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './fila-pedidos-mesa.component.html',
    styleUrl: './fila-pedidos-mesa.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FilaPedidosMesaComponent implements OnInit, OnDestroy {
    private readonly filaService = inject(FilaPedidosMesaService);
    private readonly motoboyService = inject(MotoboyService);
    private pollingSubscription?: Subscription;

    // Signals
    readonly pedidosPendentes = this.filaService.pedidosPendentes;
    readonly carregando = this.filaService.carregando;
    readonly erro = this.filaService.erro;
    readonly quantidade = this.filaService.quantidade;

    readonly processando = signal<string | null>(null); // ID do pedido sendo processado
    readonly pedidoExpandido = signal<string | null>(null);
    motivoRejeicaoTexto = ''; // Usar variável normal para ngModel
    readonly mostrarModalRejeicao = signal(false);
    readonly pedidoParaRejeitar = signal<PedidoPendente | null>(null);

    // Modal de aceitar delivery
    readonly mostrarModalAceitar = signal(false);
    readonly pedidoParaAceitar = signal<PedidoPendente | null>(null);
    readonly motoboysDisponiveis = signal<Motoboy[]>([]);
    motoboyIdSelecionado = '';
    taxaEntrega = '';
    previsaoEntrega = '';
    readonly carregandoMotoboys = signal(false);

    // Computed
    readonly temPedidos = computed(() => this.pedidosPendentes().length > 0);

    // Verifica se o pedido é de delivery
    isDelivery(pedido: PedidoPendente): boolean {
        return pedido.tipoPedido === 'DELIVERY';
    }

    // Verifica se o pedido é de retirada
    isRetirada(pedido: PedidoPendente): boolean {
        return pedido.tipoPedido === 'RETIRADA';
    }

    // Verifica se o pedido é delivery ou retirada (precisa de tratamento especial)
    isDeliveryOuRetirada(pedido: PedidoPendente): boolean {
        return pedido.tipoPedido === 'DELIVERY' || pedido.tipoPedido === 'RETIRADA';
    }

    ngOnInit(): void {
        // Inicia polling a cada 3 segundos
        this.pollingSubscription = this.filaService.iniciarPolling(3000).subscribe();
    }

    ngOnDestroy(): void {
        this.pollingSubscription?.unsubscribe();
    }

    toggleExpandir(pedidoId: string): void {
        if (this.pedidoExpandido() === pedidoId) {
            this.pedidoExpandido.set(null);
        } else {
            this.pedidoExpandido.set(pedidoId);
        }
    }

    // Decide se deve abrir modal ou aceitar direto
    aceitarOuAbrirModal(pedido: PedidoPendente): void {
        if (this.isDeliveryOuRetirada(pedido)) {
            this.abrirModalAceitar(pedido);
        } else {
            this.aceitarPedido(pedido);
        }
    }

    // Modal de aceitar delivery
    abrirModalAceitar(pedido: PedidoPendente): void {
        this.pedidoParaAceitar.set(pedido);
        this.motoboyIdSelecionado = '';
        this.taxaEntrega = '';
        this.previsaoEntrega = '';
        this.mostrarModalAceitar.set(true);
        this.carregarMotoboys();
    }

    fecharModalAceitar(): void {
        this.mostrarModalAceitar.set(false);
        this.pedidoParaAceitar.set(null);
    }

    carregarMotoboys(): void {
        this.carregandoMotoboys.set(true);
        this.motoboyService.listar(true).subscribe({
            next: (motoboys) => {
                this.motoboysDisponiveis.set(motoboys);
                this.carregandoMotoboys.set(false);
            },
            error: () => {
                this.motoboysDisponiveis.set([]);
                this.carregandoMotoboys.set(false);
            }
        });
    }

    confirmarAceitarDelivery(): void {
        const pedido = this.pedidoParaAceitar();
        if (!pedido) return;

        const dadosDelivery: AceitarPedidoDeliveryRequest = {};

        if (this.motoboyIdSelecionado) {
            dadosDelivery.motoboyId = this.motoboyIdSelecionado;
        }
        if (this.taxaEntrega) {
            dadosDelivery.taxaEntrega = Number.parseFloat(this.taxaEntrega);
        }
        if (this.previsaoEntrega) {
            dadosDelivery.previsaoEntrega = this.previsaoEntrega;
        }

        this.processando.set(pedido.id);
        this.mostrarModalAceitar.set(false);

        this.filaService.aceitarPedido(pedido.id, dadosDelivery).subscribe({
            next: (pedidoCriado) => {
                console.log('Pedido aceito e criado:', pedidoCriado);
                this.processando.set(null);
                this.pedidoParaAceitar.set(null);
                this.filaService.carregarPedidos();
            },
            error: (err) => {
                console.error('Erro ao aceitar pedido:', err);
                this.processando.set(null);
                alert('Erro ao aceitar pedido. Tente novamente.');
            }
        });
    }

    aceitarPedido(pedido: PedidoPendente): void {
        this.processando.set(pedido.id);

        this.filaService.aceitarPedido(pedido.id).subscribe({
            next: (pedidoCriado) => {
                console.log('Pedido aceito e criado:', pedidoCriado);
                this.processando.set(null);
                this.filaService.carregarPedidos();
            },
            error: (err) => {
                console.error('Erro ao aceitar pedido:', err);
                this.processando.set(null);
                alert('Erro ao aceitar pedido. Tente novamente.');
            }
        });
    }

    abrirModalRejeicao(pedido: PedidoPendente): void {
        this.pedidoParaRejeitar.set(pedido);
        this.motivoRejeicaoTexto = '';
        this.mostrarModalRejeicao.set(true);
    }

    fecharModalRejeicao(): void {
        this.mostrarModalRejeicao.set(false);
        this.pedidoParaRejeitar.set(null);
        this.motivoRejeicaoTexto = '';
    }

    confirmarRejeicao(): void {
        const pedido = this.pedidoParaRejeitar();
        if (!pedido) return;

        this.processando.set(pedido.id);
        this.mostrarModalRejeicao.set(false);

        this.filaService.rejeitarPedido(pedido.id, this.motivoRejeicaoTexto).subscribe({
            next: () => {
                console.log('Pedido rejeitado');
                this.processando.set(null);
                this.pedidoParaRejeitar.set(null);
                this.filaService.carregarPedidos();
            },
            error: (err) => {
                console.error('Erro ao rejeitar pedido:', err);
                this.processando.set(null);
                alert('Erro ao rejeitar pedido. Tente novamente.');
            }
        });
    }

    formatarTempoEspera(segundos: number): string {
        return this.filaService.formatarTempoEspera(segundos);
    }

    getClasseTempoEspera(segundos: number): string {
        return this.filaService.getClasseTempoEspera(segundos);
    }

    formatarPreco(valor: number): string {
        return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    recarregar(): void {
        this.filaService.carregarPedidos();
    }
}
