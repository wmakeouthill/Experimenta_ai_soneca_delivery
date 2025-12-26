import { Component, inject, signal, computed, OnInit, OnDestroy, ChangeDetectionStrategy, PLATFORM_ID, afterNextRender, DestroyRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PedidoService, StatusPedido, Pedido, TipoPedido } from '../../services/pedido.service';
import { MotoboyAuthService, MotoboyAuth } from '../../services/motoboy-auth.service';
import { MotoboyRastreamentoService } from '../../services/motoboy-rastreamento.service';
import { GoogleMapsService } from '../../services/google-maps.service';
import { ModalMapaEntregaComponent } from '../gestao-motoboys-kanban/modal-mapa-entrega/modal-mapa-entrega.component';
import { FormatoUtil } from '../../utils/formato.util';
import { catchError, of, timer, switchMap, retry, timeout, delay, throwError, EMPTY, Subject, merge } from 'rxjs';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';

interface PedidosPorStatus {
  pronto: Pedido[];
  saiuParaEntrega: Pedido[];
}

@Component({
  selector: 'app-motoboy-kanban',
  standalone: true,
  imports: [CommonModule, RouterModule, ModalMapaEntregaComponent],
  templateUrl: './motoboy-kanban.component.html',
  styleUrl: './motoboy-kanban.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MotoboyKanbanComponent implements OnInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly http = inject(HttpClient);
  private readonly pedidoService = inject(PedidoService);
  private readonly motoboyAuthService = inject(MotoboyAuthService);
  private readonly rastreamentoService = inject(MotoboyRastreamentoService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly StatusPedido = StatusPedido;

  // Estado
  readonly motoboy = signal<MotoboyAuth | null>(null);
  readonly pedidos = signal<Pedido[]>([]);
  readonly estaCarregando = signal(false);
  readonly erro = signal<string | null>(null);
  readonly reconectando = signal(false);
  readonly modalMapaAberto = signal(false);
  readonly pedidoSelecionado = signal<Pedido | null>(null);

  // PWA
  readonly mostrarBannerPwa = signal(false);
  readonly isStandalone = signal(false);
  readonly isSafari = signal(false);
  readonly isFirefox = signal(false);
  readonly isIOS = signal(false);
  readonly pwaPromptDisponivel = signal(false);
  private deferredPrompt: any = null;

  // Computed: Instrução de instalação baseada no navegador
  // Mostra instruções quando NÃO temos o prompt nativo disponível
  readonly pwaInstrucao = computed(() => {
    // Se o prompt nativo está disponível, não precisa de instruções
    if (this.pwaPromptDisponivel()) {
      return null;
    }
    // iOS/Safari NUNCA terão o prompt
    if (this.isIOS() || this.isSafari()) {
      return 'Toque em 📤 Compartilhar → "Adicionar à Tela Inicial"';
    }
    // Firefox também não tem o prompt
    if (this.isFirefox()) {
      return 'Toque em ⋮ Menu → "Instalar"';
    }
    // Outros browsers: aguarda o prompt ou mostra instrução genérica
    return 'Aguarde o botão Instalar aparecer ou use o menu do navegador';
  });

  // Controle de polling e atualizações
  private pollingAtivo = false;
  private pollingSubscription: any = null;
  private ultimaRespostaValida: Pedido[] = [];
  private carregandoPedidos = false; // Evita múltiplas chamadas simultâneas
  private sseReader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private sseAbortController: AbortController | null = null;
  private readonly atualizacaoForcada$ = new Subject<void>(); // Para forçar atualização manual

  // Cache no sessionStorage para manter dados ao atualizar página
  private readonly CACHE_KEY = 'motoboy-pedidos-cache';

  // Computed: Pedidos agrupados por status (otimizado - uma única passagem)
  readonly pedidosPorStatus = computed(() => {
    const todosPedidos = this.pedidos();

    // Debug: log dos pedidos recebidos
    if (todosPedidos.length > 0) {
      console.debug('📊 Computed pedidosPorStatus - Total pedidos:', todosPedidos.length);
      console.debug('📋 Primeiro pedido:', {
        id: todosPedidos[0].id,
        tipoPedido: todosPedidos[0].tipoPedido,
        status: todosPedidos[0].status,
        tipoPedidoEnum: TipoPedido.DELIVERY,
        statusEnum: StatusPedido.PRONTO,
        statusEnum2: StatusPedido.SAIU_PARA_ENTREGA,
        statusEnum3: StatusPedido.FINALIZADO
      });
    }

    // Filtra e agrupa em uma única passagem para melhor performance
    const saiuParaEntrega: Pedido[] = [];
    const pronto: Pedido[] = [];
    const finalizados: Pedido[] = [];

    for (const pedido of todosPedidos) {
      // Apenas pedidos de delivery com status relevante
      // Compara com enum (que é string enum, então funciona com strings do backend)
      const tipoPedidoStr = String(pedido.tipoPedido);
      const isDelivery = tipoPedidoStr === TipoPedido.DELIVERY;

      if (!isDelivery) {
        console.debug('⏭️ Pedido ignorado (não é DELIVERY):', {
          id: pedido.id,
          tipoPedido: pedido.tipoPedido,
          tipoPedidoStr: tipoPedidoStr
        });
        continue;
      }

      // Compara status (converte para string para garantir compatibilidade)
      const statusStr = String(pedido.status);
      const isSaiuParaEntrega = statusStr === StatusPedido.SAIU_PARA_ENTREGA;
      const isPronto = statusStr === StatusPedido.PRONTO;
      const isFinalizado = statusStr === StatusPedido.FINALIZADO;

      if (isSaiuParaEntrega) {
        saiuParaEntrega.push(pedido);
      } else if (isPronto) {
        pronto.push(pedido);
      } else if (isFinalizado) {
        finalizados.push(pedido);
      } else {
        console.debug('⏭️ Pedido ignorado (status não relevante):', {
          id: pedido.id,
          status: pedido.status,
          statusStr: statusStr
        });
      }
    }

    // Ordena por data de criação (mais recentes primeiro)
    const ordenarPorData = (a: Pedido, b: Pedido): number => {
      const dataA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dataB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dataB - dataA;
    };

    saiuParaEntrega.sort(ordenarPorData);
    pronto.sort(ordenarPorData);
    finalizados.sort(ordenarPorData);

    console.debug('✅ Pedidos agrupados:', {
      saiuParaEntrega: saiuParaEntrega.length,
      pronto: pronto.length,
      finalizados: finalizados.length,
      total: saiuParaEntrega.length + pronto.length + finalizados.length
    });

    return { saiuParaEntrega, pronto, finalizados };
  });

  // Computed: Pedidos em andamento (PRONTO + SAIU_PARA_ENTREGA)
  readonly pedidosEmAndamento = computed(() => {
    const { pronto, saiuParaEntrega } = this.pedidosPorStatus();
    return [...pronto, ...saiuParaEntrega];
  });

  // Computed: Total de entregas (reutiliza lógica do pedidosPorStatus)
  readonly totalEntregas = computed(() => {
    const { saiuParaEntrega, pronto, finalizados } = this.pedidosPorStatus();
    return saiuParaEntrega.length + pronto.length + finalizados.length;
  });

  constructor() {
    afterNextRender(() => {
      if (!isPlatformBrowser(this.platformId)) return;

      // Inicializa PWA para motoboy
      this.inicializarPWA();

      // Restaura cache do sessionStorage se existir
      this.restaurarCache();

      // Verifica autenticação antes de carregar dados
      // Aguarda um pouco para garantir que o sessionStorage foi carregado após o redirect
      // Em mobile ou após refresh, pode levar mais tempo para o sessionStorage estar disponível
      // Usa requestAnimationFrame para garantir que o DOM está pronto
      requestAnimationFrame(() => {
        setTimeout(() => {
          this.verificarEAutenticar();
        }, 500); // Aumentado para 500ms para dar mais tempo após refresh
      });
    });
  }

  /**
   * Restaura cache de pedidos do sessionStorage ao inicializar.
   */
  private restaurarCache(): void {
    if (typeof sessionStorage === 'undefined') return;

    try {
      const cacheStr = sessionStorage.getItem(this.CACHE_KEY);
      if (cacheStr) {
        const cache = JSON.parse(cacheStr);
        const pedidosCache: Pedido[] = cache.pedidos || [];
        const timestamp = cache.timestamp || 0;
        const agora = Date.now();

        // Cache válido por 5 minutos
        if (pedidosCache.length > 0 && (agora - timestamp) < 5 * 60 * 1000) {
          console.debug('📋 Restaurando cache de pedidos:', pedidosCache.length, 'pedidos');
          this.ultimaRespostaValida = pedidosCache;
          this.pedidos.set([...pedidosCache]); // Nova referência para signals
        } else {
          console.debug('⏭️ Cache expirado ou vazio. Ignorando.');
          sessionStorage.removeItem(this.CACHE_KEY);
        }
      }
    } catch (error) {
      console.warn('⚠️ Erro ao restaurar cache:', error);
      sessionStorage.removeItem(this.CACHE_KEY);
    }
  }

  /**
   * Salva cache de pedidos no sessionStorage.
   */
  private salvarCache(): void {
    if (typeof sessionStorage === 'undefined') return;

    try {
      const cache = {
        pedidos: this.ultimaRespostaValida,
        timestamp: Date.now()
      };
      sessionStorage.setItem(this.CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.warn('⚠️ Erro ao salvar cache:', error);
    }
  }

  /**
   * Verifica autenticação e carrega dados do motoboy.
   * Tenta múltiplas vezes se necessário (útil após redirect ou refresh).
   */
  private verificarEAutenticar(tentativa: number = 0): void {
    const maxTentativas = 10; // Aumentado para dar mais chances após refresh
    const delayEntreTentativas = 300; // Aumentado para dar mais tempo

    const isAuth = this.motoboyAuthService.isAuthenticated();

    if (!isAuth) {
      if (tentativa < maxTentativas) {
        // Log apenas nas primeiras tentativas para não poluir o console
        if (tentativa < 3) {
          console.debug(`🔄 Tentativa ${tentativa + 1}/${maxTentativas} de verificar autenticação...`);
        }
        setTimeout(() => {
          this.verificarEAutenticar(tentativa + 1);
        }, delayEntreTentativas);
        return;
      }

      // Após todas as tentativas, redireciona para login
      console.warn('⚠️ Motoboy não autenticado após múltiplas tentativas. Redirecionando...');
      this.motoboyAuthService.logout();
      window.location.href = '/cadastro-motoboy';
      return;
    }

    // Autenticado com sucesso - carrega dados
    console.debug('✅ Motoboy autenticado. Carregando dados...');
    this.carregarMotoboy();
    // Aguarda um pouco antes de carregar pedidos para garantir que motoboy foi carregado
    setTimeout(() => {
      this.carregarPedidos();
    }, 100);
  }

  /**
   * Inicia rastreamento de localização quando motoboy está autenticado.
   */
  private iniciarRastreamento(): void {
    const motoboy = this.motoboy();
    if (!motoboy?.id) {
      return;
    }

    if (this.rastreamentoService.estaRastreando()) {
      console.debug('[Rastreamento Motoboy] Já está rastreando');
      return;
    }

    // Verifica se está no browser e tem geolocalização
    if (!isPlatformBrowser(this.platformId) || !navigator.geolocation) {
      console.warn('[Rastreamento Motoboy] Geolocalização não disponível');
      return;
    }

    console.log('[Rastreamento Motoboy] Iniciando rastreamento automático');
    this.rastreamentoService.iniciarRastreamento(motoboy.id);
  }

  /**
   * Para rastreamento de localização.
   */
  private pararRastreamento(): void {
    if (this.rastreamentoService.estaRastreando()) {
      console.log('[Rastreamento Motoboy] Parando rastreamento');
      this.rastreamentoService.pararRastreamento();
    }
  }

  ngOnInit(): void {
    // Tudo feito no afterNextRender
  }

  ngOnDestroy(): void {
    this.pararPolling();
    this.pararRastreamento();
  }

  carregarMotoboy(): void {
    const motoboyLogado = this.motoboyAuthService.motoboyLogado;
    if (motoboyLogado) {
      this.motoboy.set(motoboyLogado);
      // Inicia rastreamento após definir motoboy
      setTimeout(() => {
        this.iniciarRastreamento();
      }, 500); // Aguarda um pouco para garantir que tudo está inicializado
      return;
    }

    // Se não há motoboy logado no sessionStorage, tenta buscar do backend
    this.http.get<MotoboyAuth>('/api/motoboy/me')
      .pipe(
        catchError((err) => {
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
            if (typeof sessionStorage !== 'undefined') {
              sessionStorage.setItem('motoboy-auth-data', JSON.stringify(motoboy));
            }
            // Inicia rastreamento após carregar motoboy
            this.iniciarRastreamento();
          }
        }
      });
  }

  carregarPedidos(): void {
    // Evita múltiplas chamadas simultâneas
    if (this.carregandoPedidos) {
      console.debug('⏸️ Carregamento de pedidos já em andamento. Ignorando chamada duplicada.');
      return;
    }

    if (!this.motoboyAuthService.isAuthenticated()) {
      console.warn('⚠️ Tentativa de carregar pedidos sem autenticação. Redirecionando...');
      this.motoboyAuthService.logout();
      window.location.href = '/cadastro-motoboy';
      return;
    }

    const token = this.motoboyAuthService.getToken();
    const motoboyId = this.motoboyAuthService.motoboyLogado?.id;

    if (!token || !motoboyId) {
      console.warn('⚠️ Token ou motoboyId não encontrado:', {
        temToken: !!token,
        temMotoboyId: !!motoboyId,
        motoboyId: motoboyId
      });
      this.erro.set('Erro ao identificar motoboy. Tente fazer login novamente.');
      this.estaCarregando.set(false);

      // Tenta novamente após delay maior
      setTimeout(() => {
        if (this.motoboyAuthService.isAuthenticated()) {
          console.debug('🔄 Tentando carregar pedidos novamente...');
          this.carregarPedidos();
        }
      }, 1000); // Aumentado para 1s
      return;
    }

    console.debug('📦 Carregando pedidos do motoboy...', {
      motoboyId: motoboyId.substring(0, 8) + '...',
      tokenLength: token.length
    });

    this.carregandoPedidos = true;
    this.estaCarregando.set(true);
    this.erro.set(null);

    this.buscarPedidosComRetry()
      .subscribe({
        next: (pedidos) => {
          this.carregandoPedidos = false;
          // ✅ Cria nova referência do array (imutabilidade para signals)
          const novosPedidos = [...pedidos];
          this.ultimaRespostaValida = novosPedidos;
          this.pedidos.set(novosPedidos);
          this.estaCarregando.set(false);
          this.erro.set(null);
          this.reconectando.set(false);

          console.debug('✅ Pedidos carregados com sucesso:', {
            total: novosPedidos.length,
            pedidos: novosPedidos.map(p => ({
              id: p.id,
              status: p.status,
              tipoPedido: p.tipoPedido,
              statusType: typeof p.status,
              tipoPedidoType: typeof p.tipoPedido
            }))
          });

          // Força detecção de mudanças (útil em modo OnPush)
          // O signal já deve disparar, mas garantimos aqui
          this.cdr.markForCheck();

          console.debug('📊 Signal pedidos atualizado. Total:', this.pedidos().length);
          console.debug('📊 Computed totalEntregas:', this.totalEntregas());
          console.debug('📊 Computed pedidosPorStatus:', {
            saiuParaEntrega: this.pedidosPorStatus().saiuParaEntrega.length,
            pronto: this.pedidosPorStatus().pronto.length
          });

          // Inicia SSE e polling apenas uma vez, após carregamento inicial bem-sucedido
          if (!this.pollingAtivo) {
            this.iniciarPolling();
          }
        },
        error: (err) => {
          this.carregandoPedidos = false;
          this.estaCarregando.set(false);

          console.error('❌ Erro ao carregar pedidos:', err);

          // Mantém última resposta válida para não deixar tela vazia
          if (this.ultimaRespostaValida.length > 0) {
            // ✅ Cria nova referência do array (imutabilidade)
            this.pedidos.set([...this.ultimaRespostaValida]);
            this.erro.set('Erro ao atualizar. Exibindo dados em cache.');
            console.debug('📋 Exibindo dados em cache:', this.ultimaRespostaValida.length, 'pedidos');
          } else {
            // Se não há cache e é o carregamento inicial, mostra mensagem
            this.erro.set('Erro ao carregar pedidos. Tente recarregar a página.');
            console.warn('⚠️ Nenhum pedido em cache. Tela ficará vazia.');
          }

          // Inicia polling mesmo com erro para continuar tentando
          if (!this.pollingAtivo) {
            this.iniciarPolling();
          }
        }
      });
  }

  /**
   * Busca pedidos com retry automático e timeout.
   */
  private buscarPedidosComRetry() {
    return this.http.get<Pedido[]>('/api/motoboy/pedidos')
      .pipe(
        timeout(15000), // Timeout de 15 segundos
        retry({
          count: 3,
          delay: (error: HttpErrorResponse, retryCount: number) => {
            // Backoff exponencial: 1s, 2s, 4s
            const delayMs = Math.min(1000 * Math.pow(2, retryCount - 1), 4000);

            // Não retry em erros 401/403 (autenticação)
            if (error.status === 401 || error.status === 403) {
              this.motoboyAuthService.logout();
              window.location.href = '/cadastro-motoboy';
              return EMPTY;
            }

            this.reconectando.set(true);
            return timer(delayMs);
          }
        }),
        catchError((err: unknown) => {
          this.reconectando.set(false);

          // Verifica se é TimeoutError (do RxJS timeout operator)
          const isTimeoutError = err && typeof err === 'object' && 'name' in err && err.name === 'TimeoutError';

          // Verifica se é HttpErrorResponse
          if (err instanceof HttpErrorResponse) {
            if (err.status === 401 || err.status === 403) {
              this.motoboyAuthService.logout();
              window.location.href = '/cadastro-motoboy';
              return of([]);
            }

            if (err.status === 0) {
              this.erro.set('Sem conexão com o servidor. Verifique sua internet.');
            } else {
              this.erro.set(`Erro ao carregar pedidos (${err.status}). Tente novamente.`);
            }
          } else if (isTimeoutError) {
            this.erro.set('Tempo de resposta excedido. Verifique sua conexão.');
          } else {
            this.erro.set('Erro ao carregar pedidos. Tente novamente.');
          }

          // Retorna última resposta válida ou array vazio
          return of(this.ultimaRespostaValida.length > 0 ? this.ultimaRespostaValida : []);
        })
      );
  }

  iniciarPolling(): void {
    if (this.pollingAtivo) return;

    this.pollingAtivo = true;

    // Limpa subscription anterior se existir
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = null;
    }

    // Tenta conectar ao SSE primeiro (se disponível)
    // SSE é opcional - se falhar, continua com polling apenas
    setTimeout(() => {
      this.tentarConectarSSE();
    }, 500); // Pequeno delay para garantir que carregamento inicial terminou

    // Combina polling periódico com atualizações forçadas
    const polling$ = timer(8000, 10000); // Primeira chamada após 8s, depois a cada 10s
    const atualizacoesForcadas$ = this.atualizacaoForcada$.pipe(switchMap(() => timer(0)));

    this.pollingSubscription = merge(polling$, atualizacoesForcadas$)
      .pipe(
        switchMap(() => {
          if (!this.motoboyAuthService.isAuthenticated()) {
            this.pararPolling();
            return EMPTY;
          }

          // Evita requisições simultâneas
          if (this.carregandoPedidos) {
            return EMPTY;
          }

          // Usa buscarPedidosSemRetry para polling (retry já está no timer)
          return this.http.get<Pedido[]>('/api/motoboy/pedidos')
            .pipe(
              timeout(15000),
              catchError((err: unknown) => {
                // No polling, apenas loga o erro mas continua tentando
                const isTimeoutError = err && typeof err === 'object' && 'name' in err && err.name === 'TimeoutError';

                if (err instanceof HttpErrorResponse) {
                  if (err.status === 401 || err.status === 403) {
                    this.pararPolling();
                    this.motoboyAuthService.logout();
                    window.location.href = '/cadastro-motoboy';
                    return EMPTY;
                  }
                }

                // Retorna última resposta válida para não perder dados
                return of(this.ultimaRespostaValida.length > 0 ? this.ultimaRespostaValida : []);
              })
            );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (pedidos) => {
          this.atualizarPedidosSeMudou(pedidos);
        },
        error: () => {
          // Erro já tratado no catchError
          this.reconectando.set(false);
          // Polling continua mesmo com erro
        }
      });
  }

  /**
   * Conecta ao SSE específico para motoboy usando fetch (suporta headers customizados).
   * EventSource não suporta headers, então usamos fetch com ReadableStream.
   */
  private tentarConectarSSE(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (this.sseReader) return; // Já conectado

    const token = this.motoboyAuthService.getToken();
    const motoboyId = this.motoboyAuthService.motoboyLogado?.id;

    if (!token || !motoboyId) {
      return; // Não pode conectar sem autenticação
    }

    // Usa fetch para SSE com headers customizados
    this.conectarSSEComFetch(token, motoboyId);
  }

  /**
   * Conecta ao SSE usando fetch com autenticação (suporta headers customizados).
   */
  private conectarSSEComFetch(token: string, motoboyId: string): void {
    const url = `/api/motoboy/pedidos/stream`;

    // Aborta conexão anterior se existir
    if (this.sseAbortController) {
      this.sseAbortController.abort();
    }

    this.sseAbortController = new AbortController();

    fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Motoboy-Id': motoboyId,
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache'
      },
      credentials: 'include',
      signal: this.sseAbortController.signal
    })
      .then(response => {
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            this.motoboyAuthService.logout();
            window.location.href = '/cadastro-motoboy';
          }
          throw new Error(`SSE connection failed: ${response.status}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error('Response body is not readable');
        }

        this.sseReader = reader;
        this.processarStreamSSE(reader, decoder);
      })
      .catch(error => {
        if (error.name === 'AbortError') {
          // Conexão abortada intencionalmente
          return;
        }
        // Erro ao conectar - continua com polling apenas
        this.sseReader = null;
        this.sseAbortController = null;
        // Não loga erro aqui, é esperado que SSE possa falhar e usar polling
      });
  }

  /**
   * Processa o stream SSE linha por linha.
   */
  private async processarStreamSSE(
    reader: ReadableStreamDefaultReader<Uint8Array>,
    decoder: TextDecoder
  ): Promise<void> {
    let buffer = '';
    let eventType = '';
    let eventData = '';

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          // Stream terminado - tenta reconectar após delay
          this.sseReader = null;
          this.sseAbortController = null;
          setTimeout(() => {
            if (this.motoboyAuthService.isAuthenticated()) {
              this.tentarConectarSSE();
            }
          }, 3000);
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Mantém última linha incompleta no buffer

        for (const line of lines) {
          if (line.trim() === '') {
            // Linha vazia = fim do evento, processa
            if (eventType && eventData) {
              this.processarEventoSSE(eventType, eventData);
            }
            eventType = '';
            eventData = '';
          } else if (line.startsWith('event:')) {
            eventType = line.substring(6).trim();
          } else if (line.startsWith('data:')) {
            eventData = line.substring(5).trim();
          } else if (line.startsWith('id:')) {
            // ID do evento (opcional)
          } else if (line.startsWith('retry:')) {
            // Retry interval (opcional)
          }
        }
      }
    } catch (error) {
      // Erro ao ler stream - tenta reconectar
      this.sseReader = null;
      this.sseAbortController = null;
      setTimeout(() => {
        if (this.motoboyAuthService.isAuthenticated()) {
          this.tentarConectarSSE();
        }
      }, 3000);
    }
  }

  /**
   * Processa um evento SSE recebido.
   */
  private processarEventoSSE(eventType: string, data: string): void {
    try {
      if (eventType === 'pedidos-update' || !eventType) {
        // Se não tem eventType, assume que é pedidos-update (evento padrão)
        const pedidos: Pedido[] = JSON.parse(data);
        this.atualizarPedidosSeMudou(pedidos);
      } else if (eventType === 'ping') {
        // Heartbeat recebido - conexão está ativa
      } else if (eventType === 'error') {
        const error = JSON.parse(data);
        if (error.error?.includes('Token') || error.error?.includes('JWT')) {
          this.motoboyAuthService.logout();
          window.location.href = '/cadastro-motoboy';
        }
      }
    } catch (error) {
      // Ignora erros de parsing
    }
  }

  /**
   * Força uma atualização imediata dos pedidos.
   */
  private forcarAtualizacao(): void {
    if (!this.carregandoPedidos && this.motoboyAuthService.isAuthenticated()) {
      this.atualizacaoForcada$.next();
    }
  }

  /**
   * Atualiza pedidos apenas se houver mudanças.
   * IMPORTANTE: Sempre cria nova referência do array para garantir que signals detectem mudanças.
   */
  private atualizarPedidosSeMudou(pedidos: Pedido[]): void {
    const pedidosAtuais = this.pedidos();

    // Comparação otimizada: verifica se houve mudanças antes de atualizar
    if (pedidos.length !== pedidosAtuais.length) {
      // ✅ Cria nova referência do array (imutabilidade)
      const novosPedidos = [...pedidos];
      this.ultimaRespostaValida = novosPedidos;
      this.pedidos.set(novosPedidos);
      this.erro.set(null);
      this.reconectando.set(false);
      this.salvarCache(); // Salva no sessionStorage
      return;
    }

    // Cria map para comparação O(n) ao invés de O(n²)
    const mapAtuais = new Map(pedidosAtuais.map(p => [p.id, p]));
    const temMudancas = pedidos.some(p => {
      const atual = mapAtuais.get(p.id);
      return !atual || atual.status !== p.status || atual.updatedAt !== p.updatedAt;
    });

    if (temMudancas) {
      // ✅ Cria nova referência do array (imutabilidade)
      const novosPedidos = [...pedidos];
      this.ultimaRespostaValida = novosPedidos;
      this.pedidos.set(novosPedidos);
      this.erro.set(null);
      this.reconectando.set(false);

      // Atualiza cache
      this.salvarCache();
    }
  }

  pararPolling(): void {
    this.pollingAtivo = false;
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = null;
    }
    if (this.sseAbortController) {
      this.sseAbortController.abort();
      this.sseAbortController = null;
    }
    if (this.sseReader) {
      this.sseReader.cancel();
      this.sseReader = null;
    }
  }

  atualizarStatusPedido(pedidoId: string, novoStatus: StatusPedido): void {
    // Obtém motoboyId para validação de segurança no backend
    const motoboyId = this.motoboyAuthService.motoboyLogado?.id;

    // Chama o service com headers customizados se for motoboy
    let headers = new HttpHeaders();
    if (motoboyId) {
      headers = headers.set('X-Motoboy-Id', motoboyId);
    }

    this.http.put<Pedido>(`/api/pedidos/${pedidoId}/status`, { status: novoStatus }, { headers })
      .pipe(
        timeout(10000),
        retry({
          count: 2,
          delay: 1000
        }),
        catchError((err) => {
          this.erro.set('Erro ao atualizar status do pedido. Tente novamente.');
          return of(null);
        })
      )
      .subscribe({
        next: (pedidoAtualizado) => {
          if (pedidoAtualizado) {
            // ✅ Usa update() com map() que cria nova referência (imutabilidade)
            this.pedidos.update(pedidos => {
              const novosPedidos = pedidos.map(p =>
                p.id === pedidoId ? { ...pedidoAtualizado } : { ...p }
              );
              return novosPedidos;
            });
            // Atualiza cache com nova referência
            this.ultimaRespostaValida = [...this.pedidos()];
            this.salvarCache(); // Salva no sessionStorage
            this.erro.set(null);

            // Força atualização imediata para sincronizar
            this.forcarAtualizacao();
          }
        }
      });
  }

  marcarComoSaiuParaEntrega(pedido: Pedido): void {
    if (pedido.status === StatusPedido.PRONTO) {
      this.atualizarStatusPedido(pedido.id, StatusPedido.SAIU_PARA_ENTREGA);
    }
  }

  marcarComoEntregue(pedido: Pedido): void {
    if (pedido.status === StatusPedido.SAIU_PARA_ENTREGA) {
      this.atualizarStatusPedido(pedido.id, StatusPedido.FINALIZADO);
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

  formatarData(data: string | Date): string {
    return FormatoUtil.dataHora(data);
  }

  logout(): void {
    this.pararRastreamento();
    this.motoboyAuthService.logout();
    window.location.href = '/cadastro-motoboy';
  }

  /**
   * Abre o modal com mapa embutido mostrando o destino e opção de rota.
   */
  abrirRotaParaEntrega(pedido: Pedido): void {
    console.log('Abrir rota chamado para pedido:', pedido.numeroPedido, 'Coordenadas:', pedido.latitude, pedido.longitude);

    if (!pedido.latitude || !pedido.longitude) {
      this.erro.set(`Pedido #${pedido.numeroPedido}: Endereço de entrega não possui coordenadas. Não é possível abrir a rota.`);
      console.warn('Pedido sem coordenadas:', pedido);
      return;
    }

    this.pedidoSelecionado.set(pedido);
    this.modalMapaAberto.set(true);
    this.erro.set(null); // Limpa erros anteriores
    console.log('Modal aberto para pedido:', pedido.numeroPedido);
  }

  /**
   * Manipula o evento de teclado para abrir rota, prevenindo comportamento padrão.
   */
  abrirRotaComTeclado(event: KeyboardEvent, pedido: Pedido): void {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      this.abrirRotaParaEntrega(pedido);
    }
  }

  fecharModalMapa(): void {
    this.modalMapaAberto.set(false);
    this.pedidoSelecionado.set(null);
  }

  marcarComoEntregueNoModal(): void {
    const pedido = this.pedidoSelecionado();
    if (pedido) {
      this.marcarComoEntregue(pedido);
      // Fecha o modal após marcar como entregue
      this.fecharModalMapa();
    }
  }

  // ========== PWA ==========

  /**
   * Inicializa o PWA para a tela de motoboy.
   * Registra o service worker específico e configura o manifest.
   */
  private inicializarPWA(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // Adiciona o manifest dinamicamente se não existir
    this.adicionarManifestMotoboy();

    // Detecta se está rodando como app instalado (standalone)
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches
      || (navigator as any).standalone === true;
    this.isStandalone.set(isStandaloneMode);

    // Detecta navegador para instruções personalizadas
    const ua = navigator.userAgent;
    const isIOSDevice = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isSafariBrowser = /^((?!chrome|android).)*safari/i.test(ua);
    // Firefox detection: must have 'Firefox' but NOT 'Chrome'
    const isChrome = /chrome/i.test(ua) && !/edg/i.test(ua);
    const isFirefoxBrowser = /firefox/i.test(ua) && !isChrome;

    console.log('[PWA Motoboy] Browser detection:', { ua, isIOSDevice, isSafariBrowser, isChrome, isFirefoxBrowser });

    this.isIOS.set(isIOSDevice);
    this.isSafari.set(isSafariBrowser);
    this.isFirefox.set(isFirefoxBrowser);

    // PWA Install Prompt: Mostra banner se não estiver em modo standalone
    if (!isStandaloneMode) {
      // Sempre mostra o banner quando está no navegador
      this.mostrarBannerPwa.set(true);
    }

    // Registra o service worker específico do motoboy
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/pwa-sw-motoboy.js')
          .then((registration) => {
            console.log('[PWA Motoboy] Service Worker registrado com sucesso:', registration.scope);

            // Verifica atualizações periodicamente
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    console.log('[PWA Motoboy] Nova versão disponível. Recarregue a página para atualizar.');
                  }
                });
              }
            });
          })
          .catch((err) => {
            console.warn('[PWA Motoboy] Erro ao registrar Service Worker:', err);
          });
      });
    }

    // Captura o evento beforeinstallprompt para poder instalar depois
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.pwaPromptDisponivel.set(true);
      // Mantém o banner visível se não estiver em standalone
      if (!this.isStandalone()) {
        this.mostrarBannerPwa.set(true);
      }
    });

    // Detecta quando o app é instalado
    window.addEventListener('appinstalled', () => {
      console.log('[PWA Motoboy] App instalado com sucesso');
      this.mostrarBannerPwa.set(false);
      this.deferredPrompt = null;
      this.isStandalone.set(true);
    });
  }

  /**
   * Adiciona o manifest do motoboy dinamicamente ao HTML.
   */
  private adicionarManifestMotoboy(): void {
    // Verifica se já existe um link para o manifest do motoboy
    const existingLink = document.querySelector('link[rel="manifest"][href="/manifest-motoboy.webmanifest"]');
    if (existingLink) {
      return; // Já existe, não precisa adicionar novamente
    }

    // Remove o manifest do delivery se existir (para evitar conflito)
    const deliveryManifest = document.querySelector('link[rel="manifest"][href="/manifest.webmanifest"]');
    if (deliveryManifest) {
      deliveryManifest.remove();
    }

    // Adiciona o manifest do motoboy
    const link = document.createElement('link');
    link.rel = 'manifest';
    link.href = '/manifest-motoboy.webmanifest';
    document.head.appendChild(link);
  }

  /**
   * Instala o PWA quando o usuário clicar no botão.
   */
  async instalarPwa(): Promise<void> {
    if (!this.deferredPrompt) {
      console.warn('[PWA Motoboy] Prompt de instalação não disponível');
      return;
    }

    try {
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;

      console.log(`[PWA Motoboy] Usuário ${outcome === 'accepted' ? 'aceitou' : 'rejeitou'} a instalação`);

      if (outcome === 'accepted') {
        this.deferredPrompt = null;
      }

      this.mostrarBannerPwa.set(false);
    } catch (error) {
      console.error('[PWA Motoboy] Erro ao instalar PWA:', error);
    }
  }

  /**
   * Fecha o banner de instalação PWA.
   */
  fecharBannerPwa(): void {
    this.mostrarBannerPwa.set(false);
  }
}

