import { signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { DeliveryService, StatusCliente, StatusPedidoDelivery } from '../../../services/delivery.service';
import { interval, Subscription, switchMap, takeWhile, catchError, of } from 'rxjs';

const POLLING_INTERVAL_MS = 5000; // 5 segundos

/**
 * Tipo de retorno do composable useSucessoPedido
 */
export type UseSucessoPedidoReturn = ReturnType<typeof useSucessoPedido>;

/**
 * Composable para gerenciar o status do pedido de DELIVERY após envio.
 * Faz polling do status até o pedido ser finalizado ou cancelado.
 * 
 * Status para Delivery:
 * AGUARDANDO_ACEITACAO → ACEITO → PREPARANDO → PRONTO → SAIU_PARA_ENTREGA → ENTREGUE → FINALIZADO
 * 
 * Status para Retirada:
 * AGUARDANDO_ACEITACAO → ACEITO → PREPARANDO → PRONTO → FINALIZADO
 */
export function useSucessoPedido() {
    const deliveryService = inject(DeliveryService);
    const platformId = inject(PLATFORM_ID);
    const isBrowser = isPlatformBrowser(platformId);

    // Estado
    const pedidoId = signal<string | null>(null);
    const statusPedido = signal<StatusPedidoDelivery | null>(null);
    const carregandoStatus = signal(false);
    const erroStatus = signal<string | null>(null);

    // Subscription do polling
    let pollingSubscription: Subscription | null = null;

    // Computed
    const statusAtual = computed(() => statusPedido()?.status ?? 'AGUARDANDO_ACEITACAO');
    const statusDescricao = computed(() => statusPedido()?.statusDescricao ?? 'Aguardando confirmação do estabelecimento');
    const numeroPedido = computed(() => statusPedido()?.numeroPedido);
    const tempoEspera = computed(() => statusPedido()?.tempoEsperaSegundos ?? 0);
    const tipoPedido = computed(() => statusPedido()?.tipoPedido ?? 'DELIVERY');
    const enderecoEntrega = computed(() => statusPedido()?.enderecoEntrega);
    const nomeMotoboyAtribuido = computed(() => statusPedido()?.nomeMotoboyAtribuido);
    const telefoneMotoboyAtribuido = computed(() => statusPedido()?.telefoneMotoboyAtribuido);
    const previsaoEntrega = computed(() => statusPedido()?.previsaoEntrega);

    // Mapeia o status para os passos visuais (delivery)
    const passoAtualDelivery = computed(() => {
        const status = statusAtual();
        switch (status) {
            case 'AGUARDANDO_ACEITACAO':
                return 1; // Aguardando confirmação
            case 'ACEITO':
            case 'PREPARANDO':
                return 2; // Em preparação
            case 'PRONTO':
                return 3; // Pronto
            case 'SAIU_PARA_ENTREGA':
                return 4; // A caminho
            case 'ENTREGUE':
            case 'FINALIZADO':
                return 5; // Entregue
            case 'CANCELADO':
                return 0; // Cancelado
            default:
                return 1;
        }
    });

    // Mapeia o status para os passos visuais (retirada)
    const passoAtualRetirada = computed(() => {
        const status = statusAtual();
        switch (status) {
            case 'AGUARDANDO_ACEITACAO':
                return 1; // Aguardando confirmação
            case 'ACEITO':
            case 'PREPARANDO':
                return 2; // Em preparação
            case 'PRONTO':
            case 'FINALIZADO':
                return 3; // Pronto para retirada
            case 'CANCELADO':
                return 0; // Cancelado
            default:
                return 1;
        }
    });

    // Passo atual considerando o tipo do pedido
    const passoAtual = computed(() => {
        return tipoPedido() === 'RETIRADA' ? passoAtualRetirada() : passoAtualDelivery();
    });

    // Total de passos para cada tipo
    const totalPassos = computed(() => tipoPedido() === 'RETIRADA' ? 3 : 5);

    const etapaConcluida = (etapa: number) => computed(() => {
        const passo = passoAtual();
        const status = statusAtual();
        if (status === 'CANCELADO') return false;
        return passo > etapa;
    });

    const etapaAtiva = (etapa: number) => computed(() => {
        const passo = passoAtual();
        const status = statusAtual();
        if (status === 'CANCELADO') return false;
        return passo === etapa;
    });

    const pedidoCancelado = computed(() => statusAtual() === 'CANCELADO');
    const pedidoFinalizado = computed(() => {
        const status = statusAtual();
        return status === 'FINALIZADO' || status === 'ENTREGUE';
    });
    const pedidoTerminado = computed(() => {
        const status = statusAtual();
        return status === 'FINALIZADO' || status === 'CANCELADO' || status === 'ENTREGUE';
    });
    const pedidoEmPreparacao = computed(() => {
        const status = statusAtual();
        return status === 'ACEITO' || status === 'PREPARANDO';
    });
    const pedidoPronto = computed(() => statusAtual() === 'PRONTO');
    const pedidoACaminho = computed(() => statusAtual() === 'SAIU_PARA_ENTREGA');

    /**
     * Inicia o acompanhamento do pedido.
     * Aguarda a hidratação completar antes de iniciar o polling.
     * Nota: Este método usa o endpoint público de delivery, que pode retornar 404
     * para pedidos que não foram criados pela API pública.
     */
    function iniciarAcompanhamento(id: string): void {
        if (!isBrowser) return;

        pedidoId.set(id);
        statusPedido.set(null);
        erroStatus.set(null);

        // Busca inicial
        buscarStatus();

        // Atrasa o início do polling para evitar problemas de hidratação
        setTimeout(() => {
            if (pedidoId() === id) {
                iniciarPolling();
            }
        }, 100);
    }

    /**
     * Inicia o acompanhamento com dados já conhecidos do histórico.
     * Use este método quando tiver os dados do pedido do histórico
     * ao invés de chamar o endpoint público.
     */
    function iniciarAcompanhamentoComDados(dados: {
        id: string;
        status: string;
        tipoPedido: 'DELIVERY' | 'RETIRADA' | 'MESA';
        total?: number;
        createdAt?: string;
    }): void {
        if (!isBrowser) return;

        pedidoId.set(dados.id);
        erroStatus.set(null);

        // Monta um objeto StatusPedidoDelivery a partir dos dados do histórico
        const statusMapeado: StatusPedidoDelivery = {
            pedidoId: dados.id,
            status: dados.status as any,
            statusDescricao: mapearStatusParaDescricao(dados.status),
            tipoPedido: dados.tipoPedido === 'MESA' ? 'DELIVERY' : dados.tipoPedido,
            dataHoraSolicitacao: dados.createdAt || new Date().toISOString(),
            tempoEsperaSegundos: calcularTempoEspera(dados.createdAt),
            total: dados.total
        };

        statusPedido.set(statusMapeado);
        // Não inicia polling aqui - o polling do meusPedidos cuidará das atualizações
    }

    /**
     * Atualiza o status do pedido com novos dados do histórico.
     * Chamado pelo meusPedidos quando há atualização via polling.
     */
    function atualizarStatusComDados(status: string, tipoPedido: 'DELIVERY' | 'RETIRADA' | 'MESA'): void {
        const idAtual = pedidoId();
        if (!idAtual) return;

        const statusAtualObj = statusPedido();
        if (statusAtualObj) {
            statusPedido.set({
                ...statusAtualObj,
                status: status as any,
                statusDescricao: mapearStatusParaDescricao(status),
                tipoPedido: tipoPedido === 'MESA' ? 'DELIVERY' : tipoPedido
            });
        }
    }

    /**
     * Mapeia o código do status para uma descrição amigável.
     */
    function mapearStatusParaDescricao(status: string): string {
        const mapa: Record<string, string> = {
            'AGUARDANDO_ACEITACAO': 'Aguardando confirmação do estabelecimento',
            'PENDENTE': 'Aguardando confirmação',
            'ACEITO': 'Pedido aceito',
            'PREPARANDO': 'Seu pedido está sendo preparado',
            'PRONTO': 'Pedido pronto',
            'SAIU_PARA_ENTREGA': 'Pedido saiu para entrega',
            'A_CAMINHO': 'Pedido a caminho',
            'ENTREGUE': 'Pedido entregue',
            'FINALIZADO': 'Pedido finalizado',
            'CANCELADO': 'Pedido cancelado'
        };
        return mapa[status] || status;
    }

    /**
     * Calcula o tempo de espera em segundos desde a criação do pedido.
     */
    function calcularTempoEspera(createdAt?: string): number {
        if (!createdAt) return 0;
        const criacao = new Date(createdAt).getTime();
        const agora = Date.now();
        return Math.max(0, Math.floor((agora - criacao) / 1000));
    }

    /**
     * Busca o status atual do pedido.
     */
    function buscarStatus(): void {
        const id = pedidoId();
        if (!id || !isBrowser) return;

        carregandoStatus.set(true);

        deliveryService.buscarStatusPedido(id).subscribe({
            next: (status) => {
                carregandoStatus.set(false);
                statusPedido.set(status);
                erroStatus.set(null);

                if (status.status === 'FINALIZADO' || status.status === 'CANCELADO' || status.status === 'ENTREGUE') {
                    pararPolling();
                }
            },
            error: (err) => {
                carregandoStatus.set(false);
                if (err.status === 404) {
                    // Pedido ainda pode estar sendo processado
                    console.log('Pedido não encontrado, pode estar em processamento');
                } else {
                    erroStatus.set('Erro ao buscar status do pedido');
                }
            }
        });
    }

    /**
     * Inicia o polling do status.
     */
    function iniciarPolling(): void {
        if (!isBrowser) return;

        pararPolling(); // Limpa polling anterior se existir

        pollingSubscription = interval(POLLING_INTERVAL_MS)
            .pipe(
                switchMap(() => {
                    const id = pedidoId();
                    if (!id) return of(null);
                    return deliveryService.buscarStatusPedido(id).pipe(
                        catchError(() => of(null))
                    );
                }),
                takeWhile((status) => {
                    if (!status) return true; // Continua tentando
                    return status.status !== 'FINALIZADO' &&
                        status.status !== 'CANCELADO' &&
                        status.status !== 'ENTREGUE';
                }, true)
            )
            .subscribe({
                next: (status) => {
                    if (status) {
                        statusPedido.set(status);
                        erroStatus.set(null);
                    }
                }
            });
    }

    /**
     * Para o polling.
     */
    function pararPolling(): void {
        pollingSubscription?.unsubscribe();
        pollingSubscription = null;
    }

    /**
     * Limpa o estado e para o polling.
     */
    function limpar(): void {
        pararPolling();
        pedidoId.set(null);
        statusPedido.set(null);
        erroStatus.set(null);
    }

    /**
     * Cleanup ao destruir.
     */
    function destroy(): void {
        pararPolling();
    }

    /**
     * Formata o tempo de espera em minutos.
     */
    function formatarTempoEspera(): string {
        const segundos = tempoEspera();
        if (segundos < 60) {
            return 'Agora mesmo';
        }
        const minutos = Math.floor(segundos / 60);
        if (minutos === 1) {
            return '1 minuto';
        }
        return `${minutos} minutos`;
    }

    /**
     * Retorna a descrição do passo atual.
     */
    function getDescricaoPasso(passo: number): string {
        if (tipoPedido() === 'RETIRADA') {
            switch (passo) {
                case 1: return 'Aguardando confirmação';
                case 2: return 'Em preparação';
                case 3: return 'Pronto para retirada';
                default: return '';
            }
        } else {
            switch (passo) {
                case 1: return 'Aguardando confirmação';
                case 2: return 'Em preparação';
                case 3: return 'Pronto';
                case 4: return 'A caminho';
                case 5: return 'Entregue';
                default: return '';
            }
        }
    }

    /**
     * Retorna o ícone do passo.
     */
    function getIconePasso(passo: number): string {
        if (tipoPedido() === 'RETIRADA') {
            switch (passo) {
                case 1: return '⏳';
                case 2: return '👨‍🍳';
                case 3: return '✅';
                default: return '';
            }
        } else {
            switch (passo) {
                case 1: return '⏳';
                case 2: return '👨‍🍳';
                case 3: return '✅';
                case 4: return '🛵';
                case 5: return '🏠';
                default: return '';
            }
        }
    }

    return {
        // Estado
        pedidoId: pedidoId.asReadonly(),
        statusPedido: statusPedido.asReadonly(),
        carregandoStatus: carregandoStatus.asReadonly(),
        erroStatus: erroStatus.asReadonly(),

        // Computed
        statusAtual,
        statusDescricao,
        numeroPedido,
        tempoEspera,
        tipoPedido,
        enderecoEntrega,
        nomeMotoboyAtribuido,
        telefoneMotoboyAtribuido,
        previsaoEntrega,
        passoAtual,
        totalPassos,
        pedidoCancelado,
        pedidoFinalizado,
        pedidoTerminado,
        pedidoEmPreparacao,
        pedidoPronto,
        pedidoACaminho,

        // Funções de verificação de etapa
        etapaConcluida,
        etapaAtiva,

        // Métodos
        iniciarAcompanhamento,
        iniciarAcompanhamentoComDados,
        atualizarStatusComDados,
        buscarStatus,
        limpar,
        destroy,
        formatarTempoEspera,
        getDescricaoPasso,
        getIconePasso
    };
}
