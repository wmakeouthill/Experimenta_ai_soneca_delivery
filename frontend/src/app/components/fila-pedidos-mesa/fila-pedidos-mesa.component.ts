import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { FilaPedidosMesaService, PedidoPendente } from '../../services/fila-pedidos-mesa.service';

@Component({
    selector: 'app-fila-pedidos-mesa',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './fila-pedidos-mesa.component.html',
    styleUrl: './fila-pedidos-mesa.component.css'
})
export class FilaPedidosMesaComponent implements OnInit, OnDestroy {
    private filaService = inject(FilaPedidosMesaService);
    private pollingSubscription?: Subscription;

    // Signals
    pedidosPendentes = this.filaService.pedidosPendentes;
    carregando = this.filaService.carregando;
    erro = this.filaService.erro;
    quantidade = this.filaService.quantidade;

    processando = signal<string | null>(null); // ID do pedido sendo processado
    pedidoExpandido = signal<string | null>(null);
    motivoRejeicaoTexto = ''; // Usar variável normal para ngModel
    mostrarModalRejeicao = signal(false);
    pedidoParaRejeitar = signal<PedidoPendente | null>(null);    // Computed
    temPedidos = computed(() => this.pedidosPendentes().length > 0);

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
