import { signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { DeliveryService, StatusPedidoDelivery } from '../../../services/delivery.service';
import { firstValueFrom } from 'rxjs';

const ITENS_POR_PAGINA = 10;

export interface HistoricoPedidoDelivery {
    id: string;
    status: string;
    total: number;
    tipoPedido: 'DELIVERY' | 'RETIRADA';
    createdAt: string;
    itens: Array<{
        produtoNome: string;
        quantidade: number;
        preco: number;
    }>;
}

/**
 * Composable para gerenciar o histórico de pedidos do cliente delivery.
 */
export function useMeusPedidos(clienteIdFn: () => string | undefined) {
    const deliveryService = inject(DeliveryService);
    const platformId = inject(PLATFORM_ID);
    const isBrowser = isPlatformBrowser(platformId);

    // Estado
    const pedidos = signal<HistoricoPedidoDelivery[]>([]);
    const carregando = signal(false);
    const erro = signal<string | null>(null);
    const paginaAtual = signal(0);
    const totalPaginas = signal(0);
    const totalPedidos = signal(0);
    const carregado = signal(false);

    // Estado para detalhes do pedido selecionado
    const pedidoSelecionado = signal<HistoricoPedidoDelivery | null>(null);
    const mostrandoDetalhes = signal(false);

    // Computed
    const temMaisPaginas = computed(() => paginaAtual() < totalPaginas() - 1);
    const temPaginaAnterior = computed(() => paginaAtual() > 0);
    const temMais = temMaisPaginas;

    /**
     * Seleciona um pedido para ver detalhes.
     */
    function selecionarPedido(pedido: HistoricoPedidoDelivery): void {
        pedidoSelecionado.set(pedido);
        mostrandoDetalhes.set(true);
    }

    /**
     * Fecha os detalhes do pedido.
     */
    function fecharDetalhes(): void {
        mostrandoDetalhes.set(false);
        pedidoSelecionado.set(null);
    }

    /**
     * Carrega a primeira página de pedidos.
     */
    async function carregar(): Promise<void> {
        const clienteId = clienteIdFn();
        if (!clienteId || !isBrowser) return;

        carregando.set(true);
        erro.set(null);
        paginaAtual.set(0);

        try {
            const response: any = await firstValueFrom(deliveryService.buscarHistoricoPedidos(0, ITENS_POR_PAGINA));

            let listaBruta: any[] = [];

            if (Array.isArray(response)) {
                listaBruta = response;
                totalPaginas.set(1);
                totalPedidos.set(response.length);
            } else if (response && Array.isArray(response.content)) {
                listaBruta = response.content;
                totalPaginas.set(response.totalPages || 1);
                totalPedidos.set(response.totalElements || listaBruta.length);
            }

            const listaMapeada: HistoricoPedidoDelivery[] = listaBruta.map(p => ({
                id: p.pedidoId,
                status: p.status,
                total: p.total || 0,
                tipoPedido: p.tipoPedido,
                createdAt: p.dataHoraSolicitacao,
                itens: p.itens ? p.itens.map((i: any) => ({
                    produtoNome: i.nomeProduto || i.produto?.nome || 'Item',
                    quantidade: i.quantidade,
                    preco: i.precoUnitario || 0
                })) : []
            }));

            pedidos.set(listaMapeada);
            carregado.set(true);
        } catch (e) {
            console.error('Erro ao carregar histórico de pedidos:', e);
            erro.set('Não foi possível carregar seus pedidos.');
            pedidos.set([]);
        } finally {
            carregando.set(false);
        }
    }

    /**
     * Carrega mais pedidos (append ao existente).
     */
    function carregarMais(): void {
        // TODO: Implementar paginação
    }

    /**
     * Limpa o estado.
     */
    function limpar(): void {
        pedidos.set([]);
        paginaAtual.set(0);
        totalPaginas.set(0);
        totalPedidos.set(0);
        carregado.set(false);
        erro.set(null);
        pedidoSelecionado.set(null);
        mostrandoDetalhes.set(false);
    }

    /**
     * Formata o status do pedido para exibição.
     */
    function formatarStatus(status: string): string {
        const statusMap: Record<string, string> = {
            'PENDENTE': 'Aguardando',
            'PREPARANDO': 'Preparando',
            'A_CAMINHO': 'A caminho',
            'ENTREGUE': 'Entregue',
            'CANCELADO': 'Cancelado'
        };
        return statusMap[status] || status;
    }

    /**
     * Retorna a cor/classe do status.
     */
    function classeStatus(status: string): string {
        const classeMap: Record<string, string> = {
            'PENDENTE': 'status-pendente',
            'PREPARANDO': 'status-preparando',
            'A_CAMINHO': 'status-caminho',
            'ENTREGUE': 'status-entregue',
            'CANCELADO': 'status-cancelado'
        };
        return classeMap[status] || '';
    }

    return {
        // Estado
        pedidos: pedidos.asReadonly(),
        carregando: carregando.asReadonly(),
        erro: erro.asReadonly(),
        paginaAtual: paginaAtual.asReadonly(),
        totalPaginas: totalPaginas.asReadonly(),
        totalPedidos: totalPedidos.asReadonly(),
        carregado: carregado.asReadonly(),
        pedidoSelecionado: pedidoSelecionado.asReadonly(),
        mostrandoDetalhes: mostrandoDetalhes.asReadonly(),

        // Computed
        temMaisPaginas,
        temPaginaAnterior,
        temMais,

        // Métodos
        carregar,
        carregarMais,
        limpar,
        formatarStatus,
        classeStatus,
        selecionarPedido,
        fecharDetalhes
    };
}
