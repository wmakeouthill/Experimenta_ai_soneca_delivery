import { Component, OnInit, OnDestroy, inject, signal, computed, effect, ChangeDetectionStrategy, PLATFORM_ID, afterNextRender, Injector, NgZone } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { StatusPedido, Pedido } from '../../services/pedido.service';
import { useLobbyPedidos } from './composables/use-lobby-pedidos';
import { useAnimations } from './composables/use-animations';
import { SurferAnimationComponent } from './components/surfer-animation/surfer-animation.component';
import { FullscreenAnimationComponent } from './components/fullscreen-animation/fullscreen-animation.component';
import { OrderListComponent } from './components/order-list/order-list.component';
import { LobbyHeaderComponent } from './components/header/header.component';
import { ConfigAnimacaoModalComponent, ConfigAnimacao } from './components/config-animacao-modal/config-animacao-modal.component';
import { ConfigAnimacaoService } from '../../services/config-animacao.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-lobby-pedidos',
  standalone: true,
  imports: [
    CommonModule,
    LobbyHeaderComponent,
    SurferAnimationComponent,
    FullscreenAnimationComponent,
    OrderListComponent,
    ConfigAnimacaoModalComponent
  ],
  templateUrl: './lobby-pedidos.component.html',
  styleUrl: './lobby-pedidos.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LobbyPedidosComponent implements OnInit, OnDestroy {
  private readonly configAnimacaoService = inject(ConfigAnimacaoService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly injector = inject(Injector);
  private readonly authService = inject(AuthService);
  private readonly ngZone = inject(NgZone);

  readonly pedidosAnteriores = signal<Pedido[]>([]);

  readonly lobbyPedidos = useLobbyPedidos();
  readonly animations = useAnimations();

  readonly isAnimating = computed(() => this.animations.isAnimating());
  readonly mostrarConfigModal = signal<boolean>(false);
  readonly isAdministrador = this.authService.isAdministrador;

  // Expor StatusPedido para o template
  readonly StatusPedido = StatusPedido;

  private pollingInterval: any = null;
  private readonly intervaloPolling = 3000; // 3 segundos
  private animacaoPeriodicaInterval: any = null;

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  constructor() {
    // Effect para detectar mudanças nos pedidos (no contexto de injeção)
    effect(() => {
      if (!isPlatformBrowser(this.platformId)) return;

      const pedidosAtuais = this.lobbyPedidos.pedidos();
      const pedidosAnt = this.pedidosAnteriores();

      if (pedidosAtuais.length !== pedidosAnt.length ||
        pedidosAtuais.some((p, i) => p.id !== pedidosAnt[i]?.id || p.status !== pedidosAnt[i]?.status)) {
        this.verificarMudancas(pedidosAnt, pedidosAtuais);
        this.pedidosAnteriores.set([...pedidosAtuais]);
      }
    }, { allowSignalWrites: true });

    // Aguardar hidratação completar antes de inicializar dados
    afterNextRender(() => {
      if (!isPlatformBrowser(this.platformId)) return;

      // Inicializar dados
      this.lobbyPedidos.carregarSessaoAtiva();
      this.lobbyPedidos.carregarPedidos();
      this.iniciarPolling();
      this.carregarConfigAnimacao();
      this.iniciarAnimacaoPeriodica();
    });
  }

  ngOnInit() {
    // Tudo é feito no afterNextRender do constructor para evitar problemas de hidratação
  }

  private carregarConfigAnimacao() {
    // O serviço já trata erros e retorna valores padrão
    this.configAnimacaoService.carregar().subscribe({
      next: (config) => {
        this.animations.animacaoConfig.set({
          animacaoAtivada: config.animacaoAtivada,
          intervaloAnimacao: config.intervaloAnimacao,
          duracaoAnimacao: config.duracaoAnimacao,
          video1Url: config.video1Url || null,
          video2Url: config.video2Url || null
        });
        // Reiniciar animação periódica quando config mudar
        this.iniciarAnimacaoPeriodica();
      }
    });
  }

  ngOnDestroy() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
    if (this.animacaoPeriodicaInterval) {
      clearInterval(this.animacaoPeriodicaInterval);
    }
  }

  private iniciarPolling() {
    // Executa o polling fora da zona Angular para não bloquear hidratação/estabilidade
    this.ngZone.runOutsideAngular(() => {
      this.pollingInterval = setInterval(() => {
        // Executa a carga dentro da zona para trigger change detection
        this.ngZone.run(() => this.lobbyPedidos.carregarPedidos());
      }, this.intervaloPolling);
    });
  }

  private verificarMudancas(anteriores: Pedido[], atuais: Pedido[]) {
    // Verificar se animação periódica está ativada
    const config = this.animations.animacaoConfig();
    if (!config.animacaoAtivada) return; // Não animar automaticamente se desabilitada

    for (const atual of atuais) {
      const anterior = anteriores.find(p => p.id === atual.id);
      if (anterior && anterior.status === StatusPedido.PREPARANDO && atual.status === StatusPedido.PRONTO) {
        this.animations.animarTransicaoStatus(atual, anterior.status, config.duracaoAnimacao);
        break;
      }
    }
  }

  // Métodos vazios para eventos do modo visualização (não fazem nada)
  handleMarcarComoPronto(_id: string) {
    // Modo visualização - não faz nada
  }

  handleRemover(_id: string) {
    // Modo visualização - não faz nada
  }

  handleTrocarModo() {
    // Modo visualização - não faz nada
  }

  handleAnimacaoManual() {
    // Disparar animação manualmente - funciona sempre, mesmo sem pedidos
    // O botão "Animar" sempre funciona, independente da configuração animacaoAtivada
    const pedidos = this.lobbyPedidos.pedidos();
    const pedidosPreparando = pedidos.filter(p => p.status === StatusPedido.PREPARANDO);
    const pedidosPronto = pedidos.filter(p => p.status === StatusPedido.PRONTO);

    if (pedidosPreparando.length > 0 && pedidosPronto.length > 0) {
      // Animar o primeiro pedido pronto
      const pedidoPronto = pedidosPronto[0];
      this.animations.animarTransicaoStatus(
        pedidoPronto,
        StatusPedido.PREPARANDO,
        this.animations.animacaoConfig().duracaoAnimacao
      );
    } else if (pedidosPreparando.length > 0) {
      // Se não há pedidos prontos, criar uma animação simulada do primeiro preparando
      const pedidoPreparando = pedidosPreparando[0];
      // Simular transição: criar um pedido "fantasma" que vai para pronto
      const pedidoFantasma: Pedido = {
        ...pedidoPreparando,
        status: StatusPedido.PRONTO
      };
      this.animations.animarTransicaoStatus(
        pedidoFantasma,
        StatusPedido.PREPARANDO,
        this.animations.animacaoConfig().duracaoAnimacao
      );
    } else {
      // Sem pedidos: animar apenas a tela fullscreen global
      this.animations.animarGlobal(this.animations.animacaoConfig().duracaoAnimacao);
    }
  }

  handleAbrirConfig() {
    if (!this.isAdministrador()) {
      return;
    }
    this.mostrarConfigModal.set(true);
  }

  handleSalvarConfig(config: ConfigAnimacao) {
    // Atualizar configuração local imediatamente
    this.animations.animacaoConfig.set({
      animacaoAtivada: config.animacaoAtivada,
      intervaloAnimacao: config.intervaloAnimacao,
      duracaoAnimacao: config.duracaoAnimacao,
      video1Url: config.video1Url || null,
      video2Url: config.video2Url || null
    });

    // Reiniciar animação periódica com nova configuração
    this.iniciarAnimacaoPeriodica();

    // Fechar modal imediatamente (configuração já foi aplicada localmente)
    this.mostrarConfigModal.set(false);

    // Tentar salvar no backend (silenciosamente, sem mostrar erros)
    this.configAnimacaoService.salvar(config).subscribe({
      next: () => {
        // Configuração salva com sucesso (quando backend estiver disponível)
      },
      error: () => {
        // Backend não disponível - configuração já foi aplicada localmente
        // Não mostrar erro para o usuário
      }
    });
  }

  private iniciarAnimacaoPeriodica() {
    // Limpar intervalo anterior se existir
    if (this.animacaoPeriodicaInterval) {
      clearInterval(this.animacaoPeriodicaInterval);
      this.animacaoPeriodicaInterval = null;
    }

    const config = this.animations.animacaoConfig();

    // Só iniciar se animação automática estiver ativada
    if (!config.animacaoAtivada) {
      return;
    }

    // Converter intervaloAnimacao de segundos para milissegundos
    const intervaloMs = config.intervaloAnimacao * 1000;

    // Iniciar intervalo periódico fora da zona Angular para não bloquear estabilidade
    this.ngZone.runOutsideAngular(() => {
      this.animacaoPeriodicaInterval = setInterval(() => {
        // Executa dentro da zona Angular para trigger change detection
        this.ngZone.run(() => {
          // Verificar se ainda está ativada (pode ter mudado)
          const configAtual = this.animations.animacaoConfig();
          if (!configAtual.animacaoAtivada) {
            // Se foi desativada, parar o intervalo
            if (this.animacaoPeriodicaInterval) {
              clearInterval(this.animacaoPeriodicaInterval);
              this.animacaoPeriodicaInterval = null;
            }
            return;
          }

          // Não animar se já estiver animando
          if (this.animations.isAnimating()) {
            return;
          }

          // Disparar animação global
          this.animations.animarGlobal(configAtual.duracaoAnimacao);
        });
      }, intervaloMs);
    });
  }

  handleFecharConfig() {
    this.mostrarConfigModal.set(false);
  }

  readonly configAtual = computed(() => ({
    animacaoAtivada: this.animations.animacaoConfig().animacaoAtivada,
    intervaloAnimacao: this.animations.animacaoConfig().intervaloAnimacao,
    duracaoAnimacao: this.animations.animacaoConfig().duracaoAnimacao,
    video1Url: this.animations.animacaoConfig().video1Url || null,
    video2Url: this.animations.animacaoConfig().video2Url || null
  }));
}

