import { Component, inject, input, output, effect, signal, computed, PLATFORM_ID, ChangeDetectionStrategy, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { BaseModalComponent } from '../../../components/cardapio/modals/base-modal/base-modal.component';
import { GoogleMapsService } from '../../../services/google-maps.service';
import { StatusPedido } from '../../../services/pedido.service';

/**
 * Modal para exibir mapa com localização de entrega e modo navegação fullscreen.
 * Segue padrões Angular 20+ Zoneless com signals.
 * 
 * Funcionalidades:
 * - Modo normal: modal com mapa e botões de ação
 * - Modo navegação: fullscreen com instruções, ETA e Wake Lock
 */
@Component({
  selector: 'app-modal-mapa-entrega',
  standalone: true,
  imports: [CommonModule, BaseModalComponent],
  templateUrl: './modal-mapa-entrega.component.html',
  styleUrl: './modal-mapa-entrega.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalMapaEntregaComponent {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly googleMapsService = inject(GoogleMapsService);
  private readonly cdr = inject(ChangeDetectorRef);

  // === INPUTS ===
  readonly aberto = input<boolean>(false);
  readonly latitude = input<number | null>(null);
  readonly longitude = input<number | null>(null);
  readonly enderecoEntrega = input<string>('');
  readonly numeroPedido = input<string>('');
  readonly statusPedido = input<string>('');

  // === OUTPUTS ===
  readonly onFechar = output<void>();
  readonly onMarcarComoEntregue = output<void>();

  // === VIEW CHILDREN ===
  @ViewChild('mapContainer', { static: false }) mapContainer?: ElementRef<HTMLDivElement>;
  @ViewChild('mapContainerNav', { static: false }) mapContainerNav?: ElementRef<HTMLDivElement>;

  // === SIGNALS - Estado do componente ===
  readonly carregandoMapa = signal<boolean>(false);
  readonly viagemIniciada = signal<boolean>(false);
  readonly modoNavegacao = signal<boolean>(false);
  readonly painelMinimizado = signal<boolean>(false);

  // === SIGNALS - Navegação ===
  readonly etaMinutos = signal<number | null>(null);
  readonly distanciaRestante = signal<string>('');
  readonly proximaInstrucao = signal<string>('');
  readonly distanciaProximaManobra = signal<string>('');
  readonly iconeManobra = signal<string>('↑');

  // === COMPUTED ===
  readonly podeMarcarComoEntregue = computed(() => {
    return this.statusPedido() === StatusPedido.SAIU_PARA_ENTREGA;
  });

  // === ESTADO PRIVADO ===
  private map: any = null;
  private mapNav: any = null;
  private marker: any = null;
  private markerAtual: any = null;
  private directionsRenderer: any = null;
  private directionsRendererNav: any = null;
  private mapaInicializado = false;
  private watchPositionId: number | null = null;
  private wakeLock: any = null;
  private ultimaRotaCalculada: any = null;
  private ultimaPosicao: { lat: number; lng: number } | null = null;

  constructor() {
    if (this.isBrowser) {
      effect(() => {
        const estaAberto = this.aberto();
        const temCoordenadas = this.latitude() && this.longitude();

        if (estaAberto && temCoordenadas && !this.mapaInicializado) {
          setTimeout(() => {
            this.tentarInicializarMapa();
          }, 300);
        } else if (!estaAberto) {
          setTimeout(() => {
            this.limparMapa();
            this.mapaInicializado = false;
            this.viagemIniciada.set(false);
            this.modoNavegacao.set(false);
            this.liberarWakeLock();
          }, 0);
        }
      });
    }
  }

  // === MÉTODOS PÚBLICOS ===

  /**
   * Inicia o modo navegação fullscreen.
   */
  iniciarNavegacao(): void {
    if (this.modoNavegacao()) {
      this.sairModoNavegacao();
      return;
    }

    this.modoNavegacao.set(true);
    this.viagemIniciada.set(true);
    this.cdr.markForCheck();

    // Aguarda DOM atualizar para inicializar mapa fullscreen
    setTimeout(() => {
      this.inicializarMapaNavegacao();
      this.solicitarWakeLock();
    }, 100);
  }

  /**
   * Sai do modo navegação e volta ao modal normal.
   */
  sairModoNavegacao(): void {
    this.pararNavegacao();
    this.modoNavegacao.set(false);
    this.viagemIniciada.set(false);
    this.painelMinimizado.set(false);
    this.liberarWakeLock();
    this.cdr.markForCheck();
  }

  /**
   * Toggle do painel de instruções.
   */
  togglePainel(): void {
    this.painelMinimizado.update(v => !v);
  }

  fechar(): void {
    this.sairModoNavegacao();
    this.onFechar.emit();
  }

  marcarComoEntregue(): void {
    this.onMarcarComoEntregue.emit();
  }

  abrirNoGoogleMaps(): void {
    if (!this.latitude() || !this.longitude()) {
      return;
    }
    this.googleMapsService.abrirRotaComLocalizacaoAtual(
      this.latitude()!,
      this.longitude()!
    );
  }

  // === MÉTODOS PRIVADOS - MAPA MODAL ===

  private tentarInicializarMapa(tentativa: number = 0): void {
    const maxTentativas = 5;

    if (this.mapContainer?.nativeElement && this.latitude() && this.longitude()) {
      this.inicializarMapa();
    } else if (tentativa < maxTentativas) {
      setTimeout(() => {
        this.tentarInicializarMapa(tentativa + 1);
      }, 150);
    } else {
      console.error('MapContainer não disponível após múltiplas tentativas');
      this.carregandoMapa.set(false);
    }
  }

  private async inicializarMapa(): Promise<void> {
    const container = this.mapContainer?.nativeElement;
    if (!container || !this.latitude() || !this.longitude()) {
      return;
    }

    if (this.map) {
      this.limparMapa();
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.carregandoMapa.set(true);
    this.cdr.markForCheck();

    try {
      const maps = await this.googleMapsService.getGoogleMaps();
      if (!maps?.Map) {
        throw new Error('Google Maps API não está disponível');
      }

      const destino = { lat: this.latitude()!, lng: this.longitude()! };
      container.innerHTML = '';

      this.map = new maps.Map(container, {
        center: destino,
        zoom: 16,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        zoomControl: true
      });

      this.marker = new maps.Marker({
        position: destino,
        map: this.map,
        title: this.enderecoEntrega() || 'Endereço de entrega',
        animation: maps.Animation.DROP
      });

      this.mapaInicializado = true;

      // Tenta mostrar rota inicial
      if (navigator.geolocation && maps.DirectionsService) {
        this.obterLocalizacaoEMostrarRota(destino, maps, this.map);
      }
    } catch (error) {
      console.error('Erro ao inicializar mapa:', error);
    } finally {
      this.carregandoMapa.set(false);
      this.cdr.markForCheck();
    }
  }

  // === MÉTODOS PRIVADOS - MAPA NAVEGAÇÃO ===

  private async inicializarMapaNavegacao(): Promise<void> {
    const container = this.mapContainerNav?.nativeElement;
    if (!container || !this.latitude() || !this.longitude()) {
      console.warn('Container de navegação não disponível');
      return;
    }

    try {
      const maps = await this.googleMapsService.getGoogleMaps();
      if (!maps?.Map) {
        throw new Error('Google Maps API não está disponível');
      }

      const destino = { lat: this.latitude()!, lng: this.longitude()! };
      container.innerHTML = '';

      // Mapa em modo navegação 3D
      this.mapNav = new maps.Map(container, {
        center: destino,
        zoom: 19,
        tilt: 45,
        heading: 0,
        mapTypeId: maps.MapTypeId.ROADMAP,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: false,
        gestureHandling: 'greedy'
      });

      // Inicia tracking contínuo
      this.iniciarTrackingNavegacao(destino, maps);

    } catch (error) {
      console.error('Erro ao inicializar mapa de navegação:', error);
      this.sairModoNavegacao();
    }
  }

  private iniciarTrackingNavegacao(destino: { lat: number; lng: number }, maps: any): void {
    if (!navigator.geolocation) {
      console.error('Geolocalização não suportada');
      return;
    }

    let ultimaAtualizacaoRota = Date.now();
    const intervaloRecalculoRota = 10000; // 10 segundos

    // DirectionsRenderer para navegação
    this.directionsRendererNav = new maps.DirectionsRenderer({
      map: this.mapNav,
      suppressMarkers: true,
      preserveViewport: true,
      polylineOptions: {
        strokeColor: '#4285F4',
        strokeWeight: 6,
        strokeOpacity: 0.9
      }
    });

    // Obtém posição inicial
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const origem = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        this.ultimaPosicao = origem;
        this.calcularRotaNavegacao(origem, destino, maps);
        this.criarMarcadorLocalizacao(origem, maps);
      },
      (error) => console.warn('Erro ao obter posição inicial:', error),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );

    // Tracking contínuo
    this.watchPositionId = navigator.geolocation.watchPosition(
      (position) => {
        const origem = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        // Atualiza marcador
        if (this.markerAtual) {
          this.markerAtual.setPosition(origem);
        } else {
          this.criarMarcadorLocalizacao(origem, maps);
        }

        // Centraliza mapa
        if (this.mapNav) {
          this.mapNav.setCenter(origem);

          // Calcula heading se houver posição anterior
          if (this.ultimaPosicao) {
            const heading = this.calcularHeading(this.ultimaPosicao, origem);
            this.mapNav.setHeading(heading);
          }
        }

        // Recalcula rota periodicamente
        const agora = Date.now();
        const distanciaMovida = this.ultimaPosicao
          ? this.calcularDistancia(origem, this.ultimaPosicao)
          : 0;

        if (agora - ultimaAtualizacaoRota >= intervaloRecalculoRota || distanciaMovida > 100) {
          ultimaAtualizacaoRota = agora;
          this.calcularRotaNavegacao(origem, destino, maps);
        }

        this.ultimaPosicao = origem;
        this.cdr.markForCheck();
      },
      (error) => console.warn('Erro ao rastrear localização:', error),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }

  private calcularRotaNavegacao(origem: { lat: number; lng: number }, destino: { lat: number; lng: number }, maps: any): void {
    const directionsService = new maps.DirectionsService();

    directionsService.route(
      {
        origin: origem,
        destination: destino,
        travelMode: maps.TravelMode.DRIVING,
        provideRouteAlternatives: false
      },
      (result: any, status: string) => {
        if (status === 'OK' && result.routes[0]) {
          this.directionsRendererNav?.setDirections(result);
          this.ultimaRotaCalculada = result;
          this.atualizarInstrucoesNavegacao(result);
        }
      }
    );
  }

  private atualizarInstrucoesNavegacao(result: any): void {
    if (!result?.routes[0]?.legs[0]) return;

    const leg = result.routes[0].legs[0];

    // ETA e distância total
    this.etaMinutos.set(Math.round(leg.duration.value / 60));
    this.distanciaRestante.set(leg.distance.text);

    // Próxima instrução
    if (leg.steps[0]) {
      const step = leg.steps[0];
      const instrucaoHtml = step.instructions || '';
      const instrucaoTexto = instrucaoHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

      this.proximaInstrucao.set(instrucaoTexto);
      this.distanciaProximaManobra.set(step.distance?.text || '');

      // Ícone baseado na manobra
      this.iconeManobra.set(this.obterIconeManobra(step.maneuver));
    }

    this.cdr.markForCheck();
  }

  private obterIconeManobra(maneuver: string | undefined): string {
    if (!maneuver) return '↑';

    const icones: Record<string, string> = {
      'turn-left': '↰',
      'turn-right': '↱',
      'turn-slight-left': '↖',
      'turn-slight-right': '↗',
      'turn-sharp-left': '⬅',
      'turn-sharp-right': '➡',
      'uturn-left': '⤺',
      'uturn-right': '⤻',
      'roundabout-left': '↺',
      'roundabout-right': '↻',
      'merge': '↑',
      'fork-left': '↖',
      'fork-right': '↗',
      'straight': '↑'
    };

    return icones[maneuver] || '↑';
  }

  private criarMarcadorLocalizacao(posicao: { lat: number; lng: number }, maps: any): void {
    if (this.markerAtual) {
      this.markerAtual.setMap(null);
    }

    this.markerAtual = new maps.Marker({
      position: posicao,
      map: this.mapNav,
      title: 'Sua localização',
      icon: {
        path: maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#4285F4',
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 3
      },
      zIndex: 999
    });
  }

  // === MÉTODOS PRIVADOS - UTILITÁRIOS ===

  private obterLocalizacaoEMostrarRota(destino: { lat: number; lng: number }, maps: any, map: any): void {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const origem = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        this.exibirRota(origem, destino, maps, map);
      },
      (error) => console.warn('Erro ao obter localização:', error),
      { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 }
    );
  }

  private exibirRota(origem: { lat: number; lng: number }, destino: { lat: number; lng: number }, maps: any, map: any): void {
    if (!maps.DirectionsService || !maps.DirectionsRenderer) return;

    const directionsService = new maps.DirectionsService();
    this.directionsRenderer = new maps.DirectionsRenderer({
      map: map,
      suppressMarkers: false,
      polylineOptions: {
        strokeColor: '#667eea',
        strokeWeight: 5
      }
    });

    directionsService.route(
      {
        origin: origem,
        destination: destino,
        travelMode: maps.TravelMode.DRIVING
      },
      (result: any, status: string) => {
        if (status === 'OK') {
          this.directionsRenderer.setDirections(result);
          const bounds = new maps.LatLngBounds();
          result.routes[0].legs.forEach((leg: any) => {
            bounds.extend(leg.start_location);
            bounds.extend(leg.end_location);
          });
          map?.fitBounds(bounds);
        }
      }
    );
  }

  private calcularDistancia(p1: { lat: number; lng: number }, p2: { lat: number; lng: number }): number {
    const R = 6371e3;
    const φ1 = p1.lat * Math.PI / 180;
    const φ2 = p2.lat * Math.PI / 180;
    const Δφ = (p2.lat - p1.lat) * Math.PI / 180;
    const Δλ = (p2.lng - p1.lng) * Math.PI / 180;
    const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private calcularHeading(p1: { lat: number; lng: number }, p2: { lat: number; lng: number }): number {
    const lat1 = p1.lat * Math.PI / 180;
    const lat2 = p2.lat * Math.PI / 180;
    const dLon = (p2.lng - p1.lng) * Math.PI / 180;
    const y = Math.sin(dLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
    return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
  }

  // === WAKE LOCK API ===

  private async solicitarWakeLock(): Promise<void> {
    if (!this.isBrowser) return;

    try {
      if ('wakeLock' in navigator) {
        this.wakeLock = await (navigator as any).wakeLock.request('screen');
        console.log('[Navegação] Wake Lock ativado - tela não irá apagar');

        this.wakeLock.addEventListener('release', () => {
          console.log('[Navegação] Wake Lock liberado');
        });
      }
    } catch (error) {
      console.warn('[Navegação] Wake Lock não disponível:', error);
    }
  }

  private liberarWakeLock(): void {
    if (this.wakeLock) {
      this.wakeLock.release();
      this.wakeLock = null;
    }
  }

  // === LIMPEZA ===

  private pararNavegacao(): void {
    if (this.watchPositionId !== null) {
      navigator.geolocation.clearWatch(this.watchPositionId);
      this.watchPositionId = null;
    }

    if (this.directionsRendererNav) {
      this.directionsRendererNav.setMap(null);
      this.directionsRendererNav = null;
    }

    if (this.markerAtual) {
      this.markerAtual.setMap(null);
      this.markerAtual = null;
    }

    this.mapNav = null;
    this.ultimaRotaCalculada = null;
    this.ultimaPosicao = null;

    // Limpa signals
    this.etaMinutos.set(null);
    this.distanciaRestante.set('');
    this.proximaInstrucao.set('');
    this.distanciaProximaManobra.set('');
  }

  private limparMapa(): void {
    this.pararNavegacao();

    if (this.marker) {
      this.marker.setMap(null);
      this.marker = null;
    }

    if (this.directionsRenderer) {
      this.directionsRenderer.setMap(null);
      this.directionsRenderer = null;
    }

    this.map = null;
    this.liberarWakeLock();
  }
}
