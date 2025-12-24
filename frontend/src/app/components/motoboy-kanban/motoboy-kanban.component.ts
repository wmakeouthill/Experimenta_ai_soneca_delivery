import { Component, inject, signal, computed, OnInit, OnDestroy, ChangeDetectionStrategy, PLATFORM_ID, afterNextRender, DestroyRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PedidoService, StatusPedido, Pedido, TipoPedido } from '../../services/pedido.service';
import { MotoboyAuthService, MotoboyAuth } from '../../services/motoboy-auth.service';
import { catchError, of, timer, switchMap, retry, timeout, delay, throwError, EMPTY, Subject, merge } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

interface PedidosPorStatus {
  pronto: Pedido[];
  saiuParaEntrega: Pedido[];
}

@Component({
  selector: 'app-motoboy-kanban',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './motoboy-kanban.component.html',
  styleUrl: './motoboy-kanban.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MotoboyKanbanComponent implements OnInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly http = inject(HttpClient);
  private readonly pedidoService = inject(PedidoService);
  private readonly motoboyAuthService = inject(MotoboyAuthService);
  private readonly destroyRef = inject(DestroyRef);

  readonly StatusPedido = StatusPedido;

  // Estado
  readonly motoboy = signal<MotoboyAuth | null>(null);
  readonly pedidos = signal<Pedido[]>([]);
  readonly estaCarregando = signal(false);
  readonly erro = signal<string | null>(null);
  readonly reconectando = signal(false);
  
  // Controle de polling e atualizações
  private pollingAtivo = false;
  private pollingSubscription: any = null;
  private ultimaRespostaValida: Pedido[] = [];
  private carregandoPedidos = false; // Evita múltiplas chamadas simultâneas
  private sseReader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private sseAbortController: AbortController | null = null;
  private readonly atualizacaoForcada$ = new Subject<void>(); // Para forçar atualização manual

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
        statusEnum2: StatusPedido.SAIU_PARA_ENTREGA
      });
    }
    
    // Filtra e agrupa em uma única passagem para melhor performance
    const saiuParaEntrega: Pedido[] = [];
    const pronto: Pedido[] = [];
    
    for (const pedido of todosPedidos) {
      // Apenas pedidos de delivery com status relevante
      // Compara tanto com enum quanto com string (caso venha como string do backend)
      const isDelivery = pedido.tipoPedido === TipoPedido.DELIVERY || 
                         pedido.tipoPedido === 'DELIVERY';
      
      if (!isDelivery) {
        console.debug('⏭️ Pedido ignorado (não é DELIVERY):', {
          id: pedido.id,
          tipoPedido: pedido.tipoPedido
        });
        continue;
      }
      
      // Compara status (suporta tanto enum quanto string)
      const status = pedido.status;
      const isSaiuParaEntrega = status === StatusPedido.SAIU_PARA_ENTREGA || 
                                status === 'SAIU_PARA_ENTREGA';
      const isPronto = status === StatusPedido.PRONTO || 
                       status === 'PRONTO';
      
      if (isSaiuParaEntrega) {
        saiuParaEntrega.push(pedido);
      } else if (isPronto) {
        pronto.push(pedido);
      } else {
        console.debug('⏭️ Pedido ignorado (status não relevante):', {
          id: pedido.id,
          status: status,
          statusType: typeof status
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
    
    console.debug('✅ Pedidos agrupados:', {
      saiuParaEntrega: saiuParaEntrega.length,
      pronto: pronto.length,
      total: saiuParaEntrega.length + pronto.length
    });
    
    return { saiuParaEntrega, pronto };
  });

  // Computed: Total de entregas (reutiliza lógica do pedidosPorStatus)
  readonly totalEntregas = computed(() => {
    const { saiuParaEntrega, pronto } = this.pedidosPorStatus();
    return saiuParaEntrega.length + pronto.length;
  });

  constructor() {
    afterNextRender(() => {
      if (!isPlatformBrowser(this.platformId)) return;
      
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

  ngOnInit(): void {
    // Tudo feito no afterNextRender
  }

  ngOnDestroy(): void {
    this.pararPolling();
  }

  carregarMotoboy(): void {
    const motoboyLogado = this.motoboyAuthService.motoboyLogado;
    if (motoboyLogado) {
      this.motoboy.set(motoboyLogado);
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
            pedidos: novosPedidos.map(p => ({ id: p.id, status: p.status }))
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
    this.pedidoService.atualizarStatus(pedidoId, novoStatus)
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

  logout(): void {
    this.motoboyAuthService.logout();
    window.location.href = '/cadastro-motoboy';
  }
}

