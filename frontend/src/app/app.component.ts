import { Component, inject, OnInit, DestroyRef, PLATFORM_ID } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, filter } from 'rxjs/operators';
import { of } from 'rxjs';
import { PedidoPollingService } from './services/pedido-polling.service';
import { SessaoTrabalhoService } from './services/sessao-trabalho.service';
import { ImpressaoService } from './services/impressao.service';
import { NotificationService } from './services/notification.service';
import { ToastComponent } from './components/shared/toast/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'Snackbar System';

  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly router = inject(Router);
  private readonly pollingService = inject(PedidoPollingService);
  private readonly sessaoService = inject(SessaoTrabalhoService);
  private readonly impressaoService = inject(ImpressaoService);
  private readonly notificationService = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  // Rotas públicas que não devem iniciar serviços autenticados
  private readonly rotasPublicas = ['/mesa/', '/pedido-mesa/', '/delivery', '/politica-privacidade', '/termos-uso'];

  // Rotas onde a notificação de novo pedido deve ser suprimida
  // (ex: cliente delivery cria o pedido na própria tela, não precisa notificar)
  private readonly rotasSemNotificacao = ['/mesa/', '/pedido-mesa/', '/delivery'];

  ngOnInit(): void {
    if (this.isBrowser) {
      // Verifica se a rota atual é pública usando window.location
      // pois this.router.url pode não estar atualizado no ngOnInit
      const urlAtual = window.location.pathname;

      console.log('🔍 URL atual:', urlAtual, '| É pública:', this.isRotaPublica(urlAtual));

      if (!this.isRotaPublica(urlAtual)) {
        this.iniciarServicosGlobais();
      }

      // Monitora mudanças de rota para iniciar/parar serviços
      this.router.events.pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      ).subscribe((event) => {
        if (this.isRotaPublica(event.urlAfterRedirects)) {
          // Rota pública - para os serviços
          this.pollingService.pararPolling();
        }
      });
    }
  }

  private isRotaPublica(url: string): boolean {
    // Verifica se a URL é exatamente a rota ou começa com a rota
    return this.rotasPublicas.some(rota => url === rota || url.startsWith(rota + '/') || url.startsWith(rota));
  }

  private iniciarServicosGlobais() {
    // Verifica se há sessão ativa para iniciar o polling
    this.sessaoService.buscarAtiva().subscribe({
      next: (sessao) => {
        if (sessao) {
          console.log('Sessão ativa encontrada. Iniciando serviços globais...');
          this.pollingService.iniciarPolling(sessao.id);
          this.configurarImpressaoAutomatica();
        }
      },
      error: () => {
        console.log('Nenhuma sessão ativa encontrada ou erro ao buscar.');
      }
    });
  }

  private configurarImpressaoAutomatica() {
    this.pollingService.onNovoPedido
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(pedido => {
        console.log('🖨️ Detectado novo pedido no AppComponent. Iniciando impressão...', pedido.numeroPedido);

        // Notificação Global - suprimida em certas rotas (autoatendimento, mesa)
        const rotaAtual = this.router.url;
        if (!this.rotasSemNotificacao.some(r => rotaAtual.includes(r))) {
          this.notificationService.sucesso(`🔔 Novo pedido recebido: ${pedido.numeroPedido}`);
        }

        this.imprimirCupomAutomatico(pedido.id);
      });
  }

  private imprimirCupomAutomatico(pedidoId: string): void {
    this.impressaoService.buscarConfiguracao().pipe(
      catchError(() => {
        console.warn('Configuração de impressora não encontrada. Impressão automática cancelada.');
        return of(null);
      })
    ).subscribe((config) => {
      if (!config || !config.ativa) {
        console.warn('Impressora não configurada ou inativa. Impressão automática cancelada.');
        return;
      }

      this.impressaoService.imprimirCupom({
        pedidoId,
        tipoImpressora: config.tipoImpressora,
        nomeEstabelecimento: config.nomeEstabelecimento,
        enderecoEstabelecimento: config.enderecoEstabelecimento,
        telefoneEstabelecimento: config.telefoneEstabelecimento,
        cnpjEstabelecimento: config.cnpjEstabelecimento
      }).pipe(
        catchError((error) => {
          console.error('Erro ao imprimir cupom automaticamente:', error);
          return of(null);
        })
      ).subscribe((response) => {
        if (response?.sucesso) {
          console.log('✅ Cupom impresso com sucesso via AppComponent!');
          // Pode adicionar um som ou notificação global aqui se desejar
        }
      });
    });
  }
}
