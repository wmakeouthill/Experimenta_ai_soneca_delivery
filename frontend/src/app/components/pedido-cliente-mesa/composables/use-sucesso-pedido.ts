import { signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PedidoMesaService, StatusCliente, StatusPedidoCliente } from '../../../services/pedido-mesa.service';
import { interval, Subscription, switchMap, takeWhile, catchError, of } from 'rxjs';

const POLLING_INTERVAL_MS = 5000; // 5 segundos

/**
 * Tipo de retorno do composable useSucessoPedido
 */
export type UseSucessoPedidoReturn = ReturnType<typeof useSucessoPedido>;

/**
 * Composable para gerenciar o status do pedido após envio.
 * Faz polling do status até o pedido ser finalizado ou cancelado.
 */
export function useSucessoPedido() {
    const pedidoMesaService = inject(PedidoMesaService);
    const platformId = inject(PLATFORM_ID);
    const isBrowser = isPlatformBrowser(platformId);

    // Estado
    const pedidoId = signal<string | null>(null);
    const statusPedido = signal<StatusPedidoCliente | null>(null);
    const carregandoStatus = signal(false);
    const erroStatus = signal<string | null>(null);

    // Subscription do polling
    let pollingSubscription: Subscription | null = null;

    // Computed
    const statusAtual = computed(() => statusPedido()?.status ?? 'AGUARDANDO_ACEITACAO');
    const statusDescricao = computed(() => statusPedido()?.statusDescricao ?? 'Aguardando confirmação');
    const numeroPedido = computed(() => statusPedido()?.numeroPedido);
    const tempoEspera = computed(() => statusPedido()?.tempoEsperaSegundos ?? 0);

    // Mapeia o status para os passos visuais
    const passoAtual = computed(() => {
        const status = statusAtual();
        switch (status) {
            case 'AGUARDANDO_ACEITACAO':
                return 1; // Aguardando confirmação
            case 'ACEITO':
            case 'PREPARANDO':
                return 2; // Em preparação
            case 'PRONTO':
            case 'FINALIZADO':
                return 3; // Pronto
            case 'CANCELADO':
                return 0; // Cancelado
            default:
                return 1;
        }
    });

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
        return status === 'FINALIZADO' || status === 'PRONTO';
    });
    const pedidoTerminado = computed(() => {
        const status = statusAtual();
        return status === 'FINALIZADO' || status === 'CANCELADO';
    });

    /**
     * Inicia o acompanhamento do pedido.
     * Aguarda a hidratação completar antes de iniciar o polling.
     */
    function iniciarAcompanhamento(id: string): void {
        if (!isBrowser) return;

        pedidoId.set(id);
        statusPedido.set(null);
        erroStatus.set(null);

        // Busca inicial
        buscarStatus();

        // ✅ Atrasa o início do polling para evitar problemas de hidratação
        // Aguarda a aplicação se tornar estável (após hidratação)
        setTimeout(() => {
            if (pedidoId() === id) { // Verifica se ainda é o mesmo pedido
                iniciarPolling();
            }
        }, 100); // Delay de 100ms após a busca inicial
    }

    /**
     * Busca o status atual do pedido.
     */
    function buscarStatus(): void {
        const id = pedidoId();
        if (!id || !isBrowser) return;

        carregandoStatus.set(true);

        // Primeiro tenta endpoint público; se 404, tenta autenticado.
        pedidoMesaService.buscarStatusPedido(id).subscribe({
            next: (status) => {
                carregandoStatus.set(false);
                statusPedido.set(status);
                erroStatus.set(null);

                if (status.status === 'FINALIZADO' || status.status === 'CANCELADO') {
                    pararPolling();
                }
            },
            error: (err) => {
                if (err.status === 404) {
                    // Fallback autenticado
                    pedidoMesaService.buscarStatusPedidoAutenticado(id).subscribe({
                        next: (status) => {
                            carregandoStatus.set(false);
                            statusPedido.set(status);
                            erroStatus.set(null);
                            if (status.status === 'FINALIZADO' || status.status === 'CANCELADO') {
                                pararPolling();
                            }
                        },
                        error: (innerErr) => {
                            carregandoStatus.set(false);
                            erroStatus.set('Pedido não encontrado');
                            pararPolling();
                        }
                    });
                } else {
                    carregandoStatus.set(false);
                    erroStatus.set('Erro ao buscar status');
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
                    return pedidoMesaService.buscarStatusPedido(id).pipe(
                        catchError((err) => {
                            if (err.status === 404) {
                                return pedidoMesaService.buscarStatusPedidoAutenticado(id).pipe(catchError(() => of(null)));
                            }
                            return of(null);
                        })
                    );
                }),
                takeWhile((status) => {
                    if (!status) return true; // Continua tentando
                    return status.status !== 'FINALIZADO' && status.status !== 'CANCELADO';
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
        passoAtual,
        pedidoCancelado,
        pedidoFinalizado,
        pedidoTerminado,

        // Funções de verificação de etapa
        etapaConcluida,
        etapaAtiva,

        // Métodos
        iniciarAcompanhamento,
        buscarStatus,
        limpar,
        destroy,
        formatarTempoEspera
    };
}
