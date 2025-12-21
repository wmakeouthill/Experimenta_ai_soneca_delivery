import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, interval, switchMap, startWith, tap, catchError, of } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

export interface AdicionalPedidoPendente {
    adicionalId: string;
    nome: string;
    quantidade: number;
    precoUnitario: number;
    subtotal: number;
}

export interface ItemPedidoPendente {
    produtoId: string;
    nomeProduto: string;
    quantidade: number;
    precoUnitario: number;
    subtotal: number;
    observacoes?: string;
    adicionais?: AdicionalPedidoPendente[];
}

export type TipoPedido = 'BALCAO' | 'MESA' | 'DELIVERY' | 'RETIRADA';

export interface PedidoPendente {
    id: string;
    mesaToken: string;
    mesaId: string;
    numeroMesa: number;
    clienteId: string;
    nomeCliente: string;
    telefoneCliente?: string;
    itens: ItemPedidoPendente[];
    observacoes?: string;
    valorTotal: number;
    dataHoraSolicitacao: string;
    tempoEsperaSegundos: number;
    // Campos de delivery
    tipoPedido?: TipoPedido;
    enderecoEntrega?: string;
    previsaoEntregaCliente?: string;
}

export interface AceitarPedidoDeliveryRequest {
    motoboyId?: string;
    taxaEntrega?: number;
    previsaoEntrega?: string;
}

export interface QuantidadePendentes {
    quantidade: number;
    existemPendentes: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class FilaPedidosMesaService {
    private http = inject(HttpClient);
    private readonly API_URL = '/api/pedidos/fila-mesa';

    // Signals para estado reativo
    private _pedidosPendentes = signal<PedidoPendente[]>([]);
    private _carregando = signal(false);
    private _erro = signal<string | null>(null);

    // Computed signals
    readonly pedidosPendentes = this._pedidosPendentes.asReadonly();
    readonly carregando = this._carregando.asReadonly();
    readonly erro = this._erro.asReadonly();
    readonly quantidade = computed(() => this._pedidosPendentes().length);
    readonly existemPendentes = computed(() => this._pedidosPendentes().length > 0);

    /**
     * Lista pedidos pendentes na fila
     */
    listarPedidosPendentes(): Observable<PedidoPendente[]> {
        return this.http.get<PedidoPendente[]>(this.API_URL);
    }

    /**
     * Busca quantidade de pedidos pendentes
     */
    buscarQuantidade(): Observable<QuantidadePendentes> {
        return this.http.get<QuantidadePendentes>(`${this.API_URL}/quantidade`);
    }

    /**
     * Busca um pedido pendente específico
     */
    buscarPorId(pedidoId: string): Observable<PedidoPendente> {
        return this.http.get<PedidoPendente>(`${this.API_URL}/${pedidoId}`);
    }

    /**
     * Aceita um pedido pendente - cria o pedido real
     * Para pedidos de delivery/retirada, pode incluir motoboyId, taxaEntrega e previsaoEntrega
     */
    aceitarPedido(pedidoId: string, dadosDelivery?: AceitarPedidoDeliveryRequest): Observable<any> {
        return this.http.post(`${this.API_URL}/${pedidoId}/aceitar`, dadosDelivery || {});
    }

    /**
     * Rejeita um pedido pendente
     */
    rejeitarPedido(pedidoId: string, motivo?: string): Observable<any> {
        return this.http.post(`${this.API_URL}/${pedidoId}/rejeitar`, { motivo });
    }

    /**
     * Carrega pedidos e atualiza o signal
     */
    carregarPedidos(): void {
        this._carregando.set(true);
        this._erro.set(null);

        this.listarPedidosPendentes().pipe(
            tap(pedidos => {
                this._pedidosPendentes.set(pedidos);
                this._carregando.set(false);
            }),
            catchError(err => {
                this._erro.set('Erro ao carregar pedidos pendentes');
                this._carregando.set(false);
                return of([]);
            })
        ).subscribe();
    }

    /**
     * Inicia polling para atualizar pedidos automaticamente
     * @param intervaloMs Intervalo em milissegundos (padrão: 5 segundos)
     */
    iniciarPolling(intervaloMs: number = 5000): Observable<PedidoPendente[]> {
        return interval(intervaloMs).pipe(
            startWith(0),
            switchMap(() => this.listarPedidosPendentes()),
            tap(pedidos => this._pedidosPendentes.set(pedidos)),
            catchError(err => {
                console.error('Erro no polling de pedidos pendentes:', err);
                return of([]);
            })
        );
    }

    /**
     * Formata o tempo de espera para exibição
     */
    formatarTempoEspera(segundos: number): string {
        if (segundos < 60) {
            return `${segundos}s`;
        }
        const minutos = Math.floor(segundos / 60);
        const segs = segundos % 60;
        if (minutos < 60) {
            return `${minutos}min ${segs}s`;
        }
        const horas = Math.floor(minutos / 60);
        const mins = minutos % 60;
        return `${horas}h ${mins}min`;
    }

    /**
     * Retorna a classe CSS baseada no tempo de espera
     */
    getClasseTempoEspera(segundos: number): string {
        if (segundos < 120) return 'tempo-ok'; // < 2 min
        if (segundos < 300) return 'tempo-atencao'; // < 5 min
        return 'tempo-urgente'; // >= 5 min
    }
}
