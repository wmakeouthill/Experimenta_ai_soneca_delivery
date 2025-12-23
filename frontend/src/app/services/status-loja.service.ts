import { Injectable, inject, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

/**
 * Status possíveis da loja para o delivery.
 */
export enum StatusLoja {
    /** Loja funcionando normalmente */
    ABERTA = 'ABERTA',
    /** Loja temporariamente indisponível (alta demanda, etc.) */
    PAUSADA = 'PAUSADA',
    /** Não há sessão de trabalho ativa */
    FECHADA = 'FECHADA'
}

/**
 * Resposta do endpoint de status da loja.
 */
export interface StatusLojaResponse {
    status: StatusLoja;
    mensagem: string | null;
    numeroSessao: number | null;
}

/**
 * Serviço para verificar o status da loja (sessão de trabalho).
 * Usado pelo delivery para bloquear quando a loja está fechada ou pausada.
 */
@Injectable({
    providedIn: 'root'
})
export class StatusLojaService {
    private readonly http = inject(HttpClient);
    private readonly zone = inject(NgZone);
    private readonly apiUrl = '/api/public/delivery/status';

    /**
     * Verifica o status atual da loja (request único).
     * 
     * @returns Observable com o status da loja
     */
    verificarStatus(): Observable<StatusLojaResponse> {
        return this.http.get<StatusLojaResponse>(this.apiUrl).pipe(
            catchError(() => {
                // Em caso de erro, assume fechada por segurança
                return of({
                    status: StatusLoja.FECHADA,
                    mensagem: 'Não foi possível verificar o status da loja.',
                    numeroSessao: null
                });
            })
        );
    }

    /**
     * Conecta ao stream de eventos da loja (SSE).
     * Recebe atualizações em tempo real quando o status muda.
     */
    conectarStream(): Observable<StatusLojaResponse> {
        return new Observable<StatusLojaResponse>(observer => {
            const eventSource = new EventSource(`${this.apiUrl}/stream`);

            // Listener para status (mudança real)
            eventSource.addEventListener('status', (event: MessageEvent) => {
                this.zone.run(() => {
                    try {
                        const data = JSON.parse(event.data) as StatusLojaResponse;
                        observer.next(data);
                    } catch (e) {
                        console.error('Erro ao processar evento de status:', e);
                    }
                });
            });

            // Listener para ping (heartbeat) - apenas para manter conexão e debug
            eventSource.addEventListener('ping', () => {
                // Apenas log em debug se necessário, ou ignorar
                // console.debug('SSE Heartbeat recebido');
            });

            eventSource.onerror = (error) => {
                this.zone.run(() => {
                    // Browser tenta reconectar automaticamente em 3s por padrão.
                    // Não vamos emitir erro para a UI imediatamente para evitar "piscar" a tela de bloqueio.
                    // A UI deve manter o último estado conhecido durante instabilidades breves.

                    if (eventSource.readyState === EventSource.CLOSED) {
                        console.error('Conexão SSE fechada permanentemente. Cliente deve recarregar.');
                        // Apenas neste caso crítico emitimos um estado de fechamento/erro
                        // Mas idealmente o browser nunca entra aqui a menos que o servidor retorne 204 ou fatal
                    } else if (eventSource.readyState === EventSource.CONNECTING) {
                        console.warn('Conexão SSE perdida. Tentando reconectar...');
                        // NÃO emitimos status fechado aqui. Mantemos o último estado.
                        // O browser vai tentar reconectar.
                    }
                });
            };

            return () => {
                eventSource.close();
            };
        });
    }

    /**
     * Verifica se a loja está aberta para receber pedidos.
     */
    estaAberta(): Observable<boolean> {
        return this.verificarStatus().pipe(
            map(response => response.status === StatusLoja.ABERTA)
        );
    }
}
