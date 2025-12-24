import { Component, inject, input, output, effect, signal, PLATFORM_ID, ChangeDetectionStrategy, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { BaseModalComponent } from '../../../cardapio/modals/base-modal/base-modal.component';
import { GoogleMapsService } from '../../../../services/google-maps.service';
import { RastreamentoPedidoResponse, LocalizacaoMotoboyDTO } from '../../../../services/rastreamento-pedido.service';

/**
 * Modal para exibir rastreamento em tempo real do pedido.
 * Mostra localização do motoboy, destino e rota entre eles.
 * Segue padrões Angular 20+ Zoneless com signals.
 */
@Component({
  selector: 'app-modal-rastreamento',
  standalone: true,
  imports: [CommonModule, BaseModalComponent],
  templateUrl: './modal-rastreamento.component.html',
  styleUrl: './modal-rastreamento.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalRastreamentoComponent {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly googleMapsService = inject(GoogleMapsService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly aberto = input<boolean>(false);
  readonly rastreamento = input<RastreamentoPedidoResponse | null>(null);

  readonly onFechar = output<void>();

  @ViewChild('mapContainer', { static: false }) mapContainer?: ElementRef<HTMLDivElement>;

  private map: any = null;
  private markerMotoboy: any = null;
  private markerDestino: any = null;
  private directionsRenderer: any = null;
  readonly carregandoMapa = signal<boolean>(false);
  private mapaInicializado = false;

  constructor() {
    if (this.isBrowser) {
      // Effect para monitorar quando o modal abre/fecha e dados de rastreamento mudam
      effect(() => {
        const estaAberto = this.aberto();
        const dados = this.rastreamento();

        if (estaAberto && dados && !this.mapaInicializado) {
          setTimeout(() => {
            this.tentarInicializarMapa();
          }, 300);
        } else if (estaAberto && dados && this.mapaInicializado) {
          // Atualiza mapa quando dados mudam
          this.atualizarMapa();
        } else if (!estaAberto) {
          setTimeout(() => {
            this.limparMapa();
            this.mapaInicializado = false;
          }, 0);
        }
      });
    }
  }

  private tentarInicializarMapa(tentativa: number = 0): void {
    const maxTentativas = 5;
    const dados = this.rastreamento();

    if (this.mapContainer?.nativeElement && dados && this.temCoordenadasValidas(dados)) {
      this.inicializarMapa();
    } else if (tentativa < maxTentativas) {
      setTimeout(() => {
        this.tentarInicializarMapa(tentativa + 1);
      }, 150);
    } else {
      console.error('MapContainer não disponível ou dados inválidos após múltiplas tentativas');
      this.carregandoMapa.set(false);
    }
  }

  private temCoordenadasValidas(dados: RastreamentoPedidoResponse): boolean {
    return !!(dados.latitudeDestino && dados.longitudeDestino);
  }

  private async inicializarMapa(): Promise<void> {
    const container = this.mapContainer?.nativeElement;
    if (!container) {
      this.tentarInicializarMapa(1);
      return;
    }

    const dados = this.rastreamento();
    if (!dados || !this.temCoordenadasValidas(dados)) {
      console.warn('Coordenadas não disponíveis');
      return;
    }

    this.carregandoMapa.set(true);

    try {
      const maps = await this.googleMapsService.getGoogleMaps();

      // Centro inicial: destino ou localização do motoboy se disponível
      const centro = dados.localizacaoMotoboy?.valida
        ? { lat: dados.localizacaoMotoboy.latitude, lng: dados.localizacaoMotoboy.longitude }
        : { lat: dados.latitudeDestino!, lng: dados.longitudeDestino! };

      this.map = new maps.Map(container, {
        zoom: 15,
        center: centro,
        mapTypeId: maps.MapTypeId.ROADMAP,
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        scaleControl: true,
        streetViewControl: false,
        rotateControl: false,
        fullscreenControl: true
      });

      this.mapaInicializado = true;
      this.atualizarMapa();
    } catch (error) {
      console.error('Erro ao inicializar mapa:', error);
      this.carregandoMapa.set(false);
    } finally {
      this.carregandoMapa.set(false);
      this.cdr.markForCheck();
    }
  }

  private atualizarMapa(): void {
    if (!this.map || !this.mapaInicializado) {
      return;
    }

    const dados = this.rastreamento();
    if (!dados || !this.temCoordenadasValidas(dados)) {
      return;
    }

    const maps = (window as any).google?.maps;
    if (!maps) {
      return;
    }

    // Atualiza marcador do destino
    const destino = { lat: dados.latitudeDestino!, lng: dados.longitudeDestino! };
    if (!this.markerDestino) {
      this.markerDestino = new maps.Marker({
        position: destino,
        map: this.map,
        title: 'Seu endereço',
        icon: {
          path: maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#FF6B35',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 3
        }
      });
    } else {
      this.markerDestino.setPosition(destino);
    }

    // Atualiza marcador do motoboy se houver localização válida
    if (dados.localizacaoMotoboy?.valida) {
      const motoboyPos = {
        lat: dados.localizacaoMotoboy.latitude,
        lng: dados.localizacaoMotoboy.longitude
      };

      if (!this.markerMotoboy) {
        this.markerMotoboy = new maps.Marker({
          position: motoboyPos,
          map: this.map,
          title: `Motoboy: ${dados.motoboyNome || 'Entregador'}`,
          icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
            scaledSize: new maps.Size(40, 40)
          }
        });
      } else {
        this.markerMotoboy.setPosition(motoboyPos);
      }

      // Atualiza rota se tiver localização do motoboy
      this.exibirRota(motoboyPos, destino, maps);
    } else {
      // Se não tem localização do motoboy, apenas centraliza no destino
      this.map.setCenter(destino);
      this.map.setZoom(16);
    }
  }

  private exibirRota(origem: { lat: number; lng: number }, destino: { lat: number; lng: number }, maps: any): void {
    if (!maps.DirectionsService || !maps.DirectionsRenderer) {
      console.error('Biblioteca Directions não está disponível');
      return;
    }

    // Remove renderer anterior se existir
    if (this.directionsRenderer) {
      this.directionsRenderer.setMap(null);
    }

    const directionsService = new maps.DirectionsService();
    this.directionsRenderer = new maps.DirectionsRenderer({
      map: this.map,
      suppressMarkers: true, // Usamos nossos próprios marcadores
      polylineOptions: {
        strokeColor: '#4285F4',
        strokeWeight: 5,
        strokeOpacity: 0.8
      }
    });

    directionsService.route(
      {
        origin: origem,
        destination: destino,
        travelMode: maps.TravelMode.DRIVING
      },
      (result: any, status: any) => {
        if (status === 'OK') {
          this.directionsRenderer.setDirections(result);

          // Ajusta o zoom para mostrar toda a rota
          const bounds = new maps.LatLngBounds();
          result.routes[0].legs.forEach((leg: any) => {
            bounds.extend(leg.start_location);
            bounds.extend(leg.end_location);
          });
          this.map.fitBounds(bounds);
        } else {
          console.warn('Erro ao calcular rota:', status);
          // Se houver erro, pelo menos mostra ambos os pontos
          const bounds = new maps.LatLngBounds();
          bounds.extend(origem);
          bounds.extend(destino);
          this.map.fitBounds(bounds);
        }
      }
    );
  }

  private limparMapa(): void {
    if (this.markerMotoboy) {
      this.markerMotoboy.setMap(null);
      this.markerMotoboy = null;
    }
    if (this.markerDestino) {
      this.markerDestino.setMap(null);
      this.markerDestino = null;
    }
    if (this.directionsRenderer) {
      this.directionsRenderer.setMap(null);
      this.directionsRenderer = null;
    }
    if (this.map) {
      this.map = null;
    }
  }

  fechar(): void {
    this.onFechar.emit();
  }

  abrirNoGoogleMaps(): void {
    const dados = this.rastreamento();
    if (!dados || !dados.latitudeDestino || !dados.longitudeDestino) {
      return;
    }

    if (dados.localizacaoMotoboy?.valida) {
      // Abre rota do motoboy até o destino
      this.googleMapsService.abrirRotaNoMaps(
        dados.localizacaoMotoboy.latitude,
        dados.localizacaoMotoboy.longitude,
        dados.latitudeDestino,
        dados.longitudeDestino
      );
    } else {
      // Abre apenas o destino
      const url = `https://www.google.com/maps/search/?api=1&query=${dados.latitudeDestino},${dados.longitudeDestino}`;
      window.open(url, '_blank');
    }
  }

  calcularTempoDesde(timestamp: string | null | undefined): string {
    if (!timestamp) return '';
    
    const agora = new Date();
    const data = new Date(timestamp);
    const diffMs = agora.getTime() - data.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    
    if (diffMin < 1) return 'agora mesmo';
    if (diffMin === 1) return 'há 1 minuto';
    if (diffMin < 60) return `há ${diffMin} minutos`;
    
    const diffHoras = Math.floor(diffMin / 60);
    if (diffHoras === 1) return 'há 1 hora';
    return `há ${diffHoras} horas`;
  }
}

