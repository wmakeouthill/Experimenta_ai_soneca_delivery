import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, of, interval, BehaviorSubject } from 'rxjs';
import { switchMap, catchError, takeUntil, tap, shareReplay } from 'rxjs/operators';
import { environment } from '../../environments/environment';

/**
 * Interface para resposta de rastreamento de pedido.
 */
export interface RastreamentoPedidoResponse {
  pedidoId: string;
  numeroPedido: string;
  statusPedido: string;
  motoboyId: string;
  motoboyNome: string;
  localizacaoMotoboy: LocalizacaoMotoboyDTO | null;
  latitudeDestino: number | null;
  longitudeDestino: number | null;
  enderecoEntrega: string;
  permiteRastreamento: boolean;
  ultimaAtualizacao: string;
}

/**
 * Interface para localização do motoboy.
 */
export interface LocalizacaoMotoboyDTO {
  latitude: number;
  longitude: number;
  heading?: number;
  velocidade?: number;
  timestamp: string;
  valida: boolean;
}

/**
 * Interface para evento SSE de localização.
 */
interface LocalizacaoAtualizadaEvent {
  pedidoId: string;
  motoboyId: string;
  latitude: number;
  longitude: number;
  heading: number | null;
  velocidade: number | null;
  timestamp: string;
}

/**
 * Serviço para rastreamento de pedidos em tempo real.
 * Usa signals para reatividade e SSE para atualizações imediatas.
 * Segue padrões .cursorrules-frontend (Angular 20+ Zoneless).
 */
@Injectable({
  providedIn: 'root'
})
export class RastreamentoPedidoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/cliente/pedidos`;

  // === SIGNALS - Estado Reativo ===
  private readonly _rastreamentoAtual = signal<RastreamentoPedidoResponse | null>(null);
  private readonly _carregando = signal<boolean>(false);
  private readonly _erro = signal<string | null>(null);
  private readonly _conectado = signal<boolean>(false);

  // === COMPUTEDS - Derivados ===
  readonly rastreamentoAtual = computed(() => this._rastreamentoAtual());
  readonly carregando = computed(() => this._carregando());
  readonly erro = computed(() => this._erro());
  readonly conectado = computed(() => this._conectado());

  readonly temLocalizacaoMotoboy = computed(() => {
    const r = this._rastreamentoAtual();
    return r?.localizacaoMotoboy?.valida ?? false;
  });

  // === ESTADO PRIVADO ===
  private eventSource: EventSource | null = null;
  private pollingSubscription: any = null;
  private readonly destroy$ = new Subject<void>();
  private pedidoIdAtivo: string | null = null;
  private sseRetryCount = 0;
  private readonly MAX_SSE_RETRIES = 5;
  private readonly BASE_RETRY_DELAY = 1000; // 1 segundo

  /**
   * Inicia rastreamento em tempo real de um pedido.
   * Primeiro carrega dados iniciais, depois conecta SSE ou polling.
   * 
   * @param pedidoId ID do pedido
   * @param clienteId ID do cliente (para autenticação)
   */
  iniciarRastreamento(pedidoId: string, clienteId: string): void {
    if (this.pedidoIdAtivo === pedidoId) {
      console.debug('[Rastreamento] Já está rastreando pedido:', pedidoId);
      return;
    }

    // Para rastreamento anterior
    this.pararRastreamento();

    this.pedidoIdAtivo = pedidoId;
    this._carregando.set(true);
    this._erro.set(null);

    console.log('[Rastreamento] Iniciando rastreamento para pedido:', pedidoId);

    // Carrega dados iniciais
    this.obterRastreamento(pedidoId, clienteId).subscribe({
      next: (dados) => {
        this._rastreamentoAtual.set(dados);
        this._carregando.set(false);
        console.log('[Rastreamento] Dados iniciais carregados:', dados);

        // Conecta ao SSE para atualizações em tempo real
        this.conectarSSEInterno(pedidoId, clienteId);
      },
      error: (err) => {
        console.error('[Rastreamento] Erro ao carregar dados iniciais:', err);
        this._erro.set('Erro ao carregar dados de rastreamento');
        this._carregando.set(false);

        // Tenta polling como fallback
        this.iniciarPollingInterno(pedidoId, clienteId);
      }
    });
  }

  /**
   * Para o rastreamento ativo.
   */
  pararRastreamento(): void {
    console.log('[Rastreamento] Parando rastreamento');

    // Fecha SSE
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    // Cancela polling
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = null;
    }

    // Reseta estado
    this.pedidoIdAtivo = null;
    this._conectado.set(false);
    this._rastreamentoAtual.set(null);
    this._erro.set(null);
  }

  /**
   * Obtém dados de rastreamento de um pedido.
   */
  obterRastreamento(pedidoId: string, clienteId: string): Observable<RastreamentoPedidoResponse> {
    return this.http.get<RastreamentoPedidoResponse>(
      `${this.apiUrl}/${pedidoId}/rastreamento`,
      {
        headers: { 'X-Cliente-Id': clienteId }
      }
    );
  }

  /**
   * Conecta ao SSE stream para atualizações em tempo real.
   */
  private conectarSSEInterno(pedidoId: string, clienteId: string): void {
    if (typeof EventSource === 'undefined') {
      console.warn('[Rastreamento] EventSource não suportado, usando polling');
      this.iniciarPollingInterno(pedidoId, clienteId);
      return;
    }

    const url = `${this.apiUrl}/${pedidoId}/rastreamento/stream`;

    console.log('[Rastreamento] Conectando ao SSE:', url);

    // EventSource não suporta headers customizados
    // Usamos fetch com ReadableStream como alternativa
    this.conectarSSEComFetch(pedidoId, clienteId);
  }

  /**
   * Conecta ao SSE usando fetch (suporta headers customizados).
   */
  private conectarSSEComFetch(pedidoId: string, clienteId: string): void {
    const url = `${this.apiUrl}/${pedidoId}/rastreamento/stream`;

    fetch(url, {
      method: 'GET',
      headers: {
        'X-Cliente-Id': clienteId,
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache'
      },
      credentials: 'include'
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`SSE connection failed: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('Response body not readable');
        }

        this._conectado.set(true);
        this.sseRetryCount = 0; // Reset retry count on successful connection
        console.log('[Rastreamento] SSE conectado');

        this.processarStreamSSE(reader, pedidoId, clienteId);
      })
      .catch(error => {
        console.warn('[Rastreamento] Erro ao conectar SSE:', error);
        // Fallback para polling
        this.iniciarPollingInterno(pedidoId, clienteId);
      });
  }

  /**
   * Processa o stream SSE.
   */
  private async processarStreamSSE(
    reader: ReadableStreamDefaultReader<Uint8Array>,
    pedidoId: string,
    clienteId: string
  ): Promise<void> {
    const decoder = new TextDecoder();
    let buffer = '';
    let eventType = '';
    let eventData = '';

    try {
      while (this.pedidoIdAtivo === pedidoId) {
        const { done, value } = await reader.read();

        if (done) {
          console.log('[Rastreamento] Stream SSE terminado');
          this._conectado.set(false);
          // Tenta reconectar com backoff exponencial
          this.tentarReconectarSSE(pedidoId, clienteId);
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() === '') {
            // Linha vazia = fim do evento
            if (eventType && eventData) {
              this.processarEventoSSE(eventType, eventData);
            }
            eventType = '';
            eventData = '';
          } else if (line.startsWith('event:')) {
            eventType = line.substring(6).trim();
          } else if (line.startsWith('data:')) {
            eventData = line.substring(5).trim();
          }
        }
      }
    } catch (error) {
      console.warn('[Rastreamento] Erro ao ler stream SSE:', error);
      this._conectado.set(false);
      // Tenta reconectar com backoff exponencial
      this.tentarReconectarSSE(pedidoId, clienteId);
    }
  }

  /**
   * Tenta reconectar ao SSE com backoff exponencial.
   * Após MAX_SSE_RETRIES tentativas, recai para polling.
   */
  private tentarReconectarSSE(pedidoId: string, clienteId: string): void {
    if (this.pedidoIdAtivo !== pedidoId) {
      console.log('[Rastreamento] Reconexão cancelada - pedido diferente ativo');
      return;
    }

    this.sseRetryCount++;

    if (this.sseRetryCount > this.MAX_SSE_RETRIES) {
      console.warn(`[Rastreamento] Máximo de tentativas SSE (${this.MAX_SSE_RETRIES}) atingido. Usando polling.`);
      this.sseRetryCount = 0;
      this.iniciarPollingInterno(pedidoId, clienteId);
      return;
    }

    // Backoff exponencial: 1s, 2s, 4s, 8s, 16s (capped at 16s)
    const delay = Math.min(this.BASE_RETRY_DELAY * Math.pow(2, this.sseRetryCount - 1), 16000);
    console.log(`[Rastreamento] Tentativa ${this.sseRetryCount}/${this.MAX_SSE_RETRIES} de reconexão SSE em ${delay}ms`);

    setTimeout(() => {
      if (this.pedidoIdAtivo === pedidoId) {
        this.conectarSSEInterno(pedidoId, clienteId);
      }
    }, delay);
  }

  /**
   * Processa evento SSE recebido.
   */
  private processarEventoSSE(eventType: string, data: string): void {
    try {
      if (eventType === 'localizacao-atualizada') {
        const evento: LocalizacaoAtualizadaEvent = JSON.parse(data);
        console.log('[Rastreamento] Localização recebida via SSE:', evento);

        // Atualiza localização no rastreamento atual (merge imutável)
        const atual = this._rastreamentoAtual();
        if (atual && atual.pedidoId === evento.pedidoId) {
          this._rastreamentoAtual.set({
            ...atual,
            localizacaoMotoboy: {
              latitude: evento.latitude,
              longitude: evento.longitude,
              heading: evento.heading ?? undefined,
              velocidade: evento.velocidade ?? undefined,
              timestamp: evento.timestamp,
              valida: true
            },
            ultimaAtualizacao: evento.timestamp
          });
        }
      } else if (eventType === 'ping') {
        // Heartbeat - conexão ativa
        console.debug('[Rastreamento] Ping recebido');
      }
    } catch (error) {
      console.warn('[Rastreamento] Erro ao processar evento SSE:', error);
    }
  }

  /**
   * Inicia polling como fallback.
   */
  private iniciarPollingInterno(pedidoId: string, clienteId: string): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }

    console.log('[Rastreamento] Iniciando polling (fallback)');

    // Polling a cada 3 segundos para atualizações mais imediatas
    this.pollingSubscription = interval(3000).pipe(
      switchMap(() => this.obterRastreamento(pedidoId, clienteId)),
      catchError(err => {
        console.warn('[Rastreamento] Erro no polling:', err);
        return of(null);
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (dados) => {
        if (dados && this.pedidoIdAtivo === pedidoId) {
          this._rastreamentoAtual.set(dados);
        }
      }
    });
  }

  // === MÉTODOS LEGADOS (compatibilidade) ===

  /**
   * @deprecated Use iniciarRastreamento() ao invés
   */
  iniciarPolling(pedidoId: string, intervaloMs: number = 5000): Observable<RastreamentoPedidoResponse> {
    return interval(intervaloMs).pipe(
      switchMap(() => this.http.get<RastreamentoPedidoResponse>(
        `${this.apiUrl}/${pedidoId}/rastreamento`
      ))
    );
  }

  /**
   * @deprecated Use iniciarRastreamento() ao invés
   */
  conectarSSE(pedidoId: string): Observable<RastreamentoPedidoResponse> {
    // Retorna observable do signal para compatibilidade
    return new Observable(subscriber => {
      const checkInterval = setInterval(() => {
        const dados = this._rastreamentoAtual();
        if (dados) {
          subscriber.next(dados);
        }
      }, 1000);

      return () => clearInterval(checkInterval);
    });
  }
}
