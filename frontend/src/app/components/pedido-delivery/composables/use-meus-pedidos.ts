import { signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { DeliveryService, StatusPedidoDelivery } from '../../../services/delivery.service';
import { firstValueFrom } from 'rxjs';

const ITENS_POR_PAGINA = 10;

export interface HistoricoPedidoDelivery {
    id: string;
    status: string;
    total: number;
    tipoPedido: 'DELIVERY' | 'RETIRADA' | 'MESA';
    createdAt: string;
    itens: Array<{
        produtoId?: string;
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

    // Estado para controle de pedidos avaliados (armazenado localmente)
    const pedidosAvaliadosIds = signal<Set<string>>(new Set());

    // Computed
    const temMaisPaginas = computed(() => paginaAtual() < totalPaginas() - 1);
    const temPaginaAnterior = computed(() => paginaAtual() > 0);
    const temMais = temMaisPaginas;

    // Pedidos finalizados que ainda não foram avaliados
    const pedidosNaoAvaliados = computed(() => {
        const avaliados = pedidosAvaliadosIds();
        return pedidos().filter(p =>
            (p.status === 'FINALIZADO' || p.status === 'ENTREGUE') &&
            !avaliados.has(p.id)
        );
    });

    // Tem pedidos para avaliar?
    const temPedidosParaAvaliar = computed(() => pedidosNaoAvaliados().length > 0);

    // Primeiro pedido não avaliado (para CTA)
    const primeiroPedidoNaoAvaliado = computed(() => pedidosNaoAvaliados()[0] ?? null);

    /**
     * Marca um pedido como avaliado (localmente)
     */
    function marcarComoAvaliado(pedidoId: string): void {
        const novosAvaliados = new Set(pedidosAvaliadosIds());
        novosAvaliados.add(pedidoId);
        pedidosAvaliadosIds.set(novosAvaliados);

        // Persiste no localStorage
        if (isBrowser) {
            const stored = localStorage.getItem('pedidos_avaliados');
            const arr = stored ? JSON.parse(stored) : [];
            if (!arr.includes(pedidoId)) {
                arr.push(pedidoId);
                localStorage.setItem('pedidos_avaliados', JSON.stringify(arr));
            }
        }
    }

    /**
     * Carrega os IDs de pedidos já avaliados do localStorage
     */
    function carregarPedidosAvaliados(): void {
        if (!isBrowser) return;
        const stored = localStorage.getItem('pedidos_avaliados');
        if (stored) {
            try {
                const arr = JSON.parse(stored);
                pedidosAvaliadosIds.set(new Set(arr));
            } catch { }
        }
    }

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

        // Carrega IDs de pedidos já avaliados do localStorage
        carregarPedidosAvaliados();

        carregando.set(true);
        erro.set(null);
        paginaAtual.set(0);

        try {
            const response: any = await firstValueFrom(deliveryService.buscarHistoricoPedidos(0, ITENS_POR_PAGINA));

            let listaBruta: any[] = [];

            // O backend retorna HistoricoPedidosResponseDTO com campo 'pedidos'
            if (response && Array.isArray(response.pedidos)) {
                listaBruta = response.pedidos;
                totalPaginas.set(response.totalPaginas || 1);
                totalPedidos.set(response.totalPedidos || listaBruta.length);
                paginaAtual.set(response.paginaAtual || 0);
            } else if (Array.isArray(response)) {
                listaBruta = response;
                totalPaginas.set(1);
                totalPedidos.set(response.length);
            } else if (response && Array.isArray(response.content)) {
                listaBruta = response.content;
                totalPaginas.set(response.totalPages || 1);
                totalPedidos.set(response.totalElements || listaBruta.length);
            }

            // Mapeia para o formato esperado pelo frontend
            // Backend: id, numeroPedido, status, statusDescricao, dataHoraPedido, valorTotal, numeroMesa, itens
            // itens: produtoId, nomeProduto, quantidade, precoUnitario, subtotal, adicionais
            const listaMapeada: HistoricoPedidoDelivery[] = listaBruta.map(p => ({
                id: p.id || p.pedidoId,
                status: p.status,
                total: p.valorTotal || p.total || 0,
                tipoPedido: p.tipoPedido || (p.numeroMesa ? 'MESA' : 'DELIVERY'),
                createdAt: p.dataHoraPedido || p.dataHoraSolicitacao || p.createdAt,
                itens: p.itens ? p.itens.map((i: any) => ({
                    produtoId: i.produtoId,
                    produtoNome: i.nomeProduto || i.produtoNome || 'Item',
                    quantidade: i.quantidade || 1,
                    preco: i.precoUnitario || i.preco || 0
                })) : []
            }));

            pedidos.set(listaMapeada);
            carregado.set(true);
        } catch (e: any) {
            console.error('Erro ao carregar histórico de pedidos:', e);
            if (e?.status === 401 || e?.status === 403) {
                erro.set('Você precisa estar logado para ver seus pedidos.');
            } else {
                erro.set('Não foi possível carregar seus pedidos.');
            }
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
            'AGUARDANDO_ACEITACAO': 'Aguardando confirmação',
            'PENDENTE': 'Aguardando',
            'ACEITO': 'Aceito',
            'PREPARANDO': 'Preparando',
            'PRONTO': 'Pronto',
            'SAIU_PARA_ENTREGA': 'A caminho',
            'A_CAMINHO': 'A caminho',
            'ENTREGUE': 'Entregue',
            'FINALIZADO': 'Finalizado',
            'CANCELADO': 'Cancelado'
        };
        return statusMap[status] || status;
    }

    /**
     * Retorna a cor/classe do status.
     */
    function classeStatus(status: string): string {
        const classeMap: Record<string, string> = {
            'AGUARDANDO_ACEITACAO': 'status-pendente',
            'PENDENTE': 'status-pendente',
            'ACEITO': 'status-aceito',
            'PREPARANDO': 'status-preparando',
            'PRONTO': 'status-pronto',
            'SAIU_PARA_ENTREGA': 'status-caminho',
            'A_CAMINHO': 'status-caminho',
            'ENTREGUE': 'status-entregue',
            'FINALIZADO': 'status-finalizado',
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
        pedidosNaoAvaliados,
        temPedidosParaAvaliar,
        primeiroPedidoNaoAvaliado,

        // Métodos
        carregar,
        carregarMais,
        limpar,
        formatarStatus,
        classeStatus,
        selecionarPedido,
        fecharDetalhes,
        marcarComoAvaliado,
        carregarPedidosAvaliados
    };
}
