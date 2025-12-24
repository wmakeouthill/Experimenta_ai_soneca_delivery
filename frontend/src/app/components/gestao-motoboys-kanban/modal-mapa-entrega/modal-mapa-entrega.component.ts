import { Component, inject, input, output, effect, signal, PLATFORM_ID, ChangeDetectionStrategy, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { BaseModalComponent } from '../../../components/cardapio/modals/base-modal/base-modal.component';
import { GoogleMapsService } from '../../../services/google-maps.service';

/**
 * Modal para exibir mapa com localização de entrega e opção de abrir rota.
 * Segue padrões Angular 20+ Zoneless com signals.
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

  readonly aberto = input<boolean>(false);
  readonly latitude = input<number | null>(null);
  readonly longitude = input<number | null>(null);
  readonly enderecoEntrega = input<string>('');
  readonly numeroPedido = input<string>('');

  readonly onFechar = output<void>();

  @ViewChild('mapContainer', { static: false }) mapContainer?: ElementRef<HTMLDivElement>;

  private map: any = null;
  private marker: any = null;
  readonly carregandoMapa = signal<boolean>(false);
  private mapaInicializado = false;

  constructor() {
    if (this.isBrowser) {
      // Effect para monitorar quando o modal abre/fecha e coordenadas mudam
      effect(() => {
        const estaAberto = this.aberto();
        const temCoordenadas = this.latitude() && this.longitude();
        
        if (estaAberto && temCoordenadas && !this.mapaInicializado) {
          // Aguarda um ciclo completo de renderização antes de tentar inicializar
          // O ViewChild precisa estar disponível no DOM
          setTimeout(() => {
            this.tentarInicializarMapa();
          }, 300);
        } else if (!estaAberto) {
          this.limparMapa();
          this.mapaInicializado = false;
        }
      });
    }
  }

  /**
   * Tenta inicializar o mapa, verificando se o ViewChild está disponível.
   * Se não estiver, tenta novamente após um delay.
   */
  private tentarInicializarMapa(tentativa: number = 0): void {
    const maxTentativas = 5;
    
    if (this.mapContainer?.nativeElement && this.latitude() && this.longitude()) {
      this.inicializarMapa();
    } else if (tentativa < maxTentativas) {
      // Tenta novamente após um delay
      setTimeout(() => {
        this.tentarInicializarMapa(tentativa + 1);
      }, 150);
    } else {
      console.error('MapContainer não disponível após múltiplas tentativas');
      this.carregandoMapa.set(false);
    }
  }

  private async inicializarMapa(): Promise<void> {
    // Verifica se o container está disponível ANTES de tudo
    const container = this.mapContainer?.nativeElement;
    if (!container) {
      console.warn('MapContainer ainda não disponível, tentando novamente...');
      this.tentarInicializarMapa(1);
      return;
    }

    if (!this.latitude() || !this.longitude()) {
      console.warn('Coordenadas não disponíveis:', {
        latitude: this.latitude(),
        longitude: this.longitude()
      });
      return;
    }

    // Se já existe um mapa, limpa antes de criar um novo
    if (this.map) {
      this.limparMapa();
      // Aguarda um pouco para garantir que a limpeza foi concluída
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.carregandoMapa.set(true);
    this.cdr.markForCheck();

    try {
      const maps = await this.googleMapsService.getGoogleMaps();
      
      // Verifica se maps.Map está disponível
      if (!maps || !maps.Map) {
        console.error('Google Maps API não está disponível:', { maps, temMap: !!maps?.Map });
        throw new Error('Google Maps API não está disponível');
      }
      
      // Verifica novamente se o container ainda está disponível após carregar Maps
      const containerAtualizado = this.mapContainer?.nativeElement;
      if (!containerAtualizado) {
        console.error('MapContainer não disponível após carregar Google Maps');
        this.carregandoMapa.set(false);
        this.cdr.markForCheck();
        return;
      }

      const destino = { lat: this.latitude()!, lng: this.longitude()! };

      console.log('Inicializando mapa com destino:', destino);
      console.log('Maps disponível:', { temMap: !!maps.Map, temMarker: !!maps.Marker });

      // Limpa o container antes de criar o mapa
      containerAtualizado.innerHTML = '';

      // Cria o mapa centralizado no destino
      this.map = new maps.Map(containerAtualizado, {
        center: destino,
        zoom: 16,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        zoomControl: true
      });

      // Adiciona marcador no destino
      this.marker = new maps.Marker({
        position: destino,
        map: this.map,
        title: this.enderecoEntrega() || 'Endereço de entrega',
        animation: maps.Animation.DROP
      });

      this.mapaInicializado = true;

      // Tenta obter localização atual do navegador/celular e mostrar rota
      // Verifica se a biblioteca directions está disponível
      if (navigator.geolocation && maps.DirectionsService) {
        console.log('Solicitando localização atual do navegador/celular...');
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const origem = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            console.log('Localização obtida:', origem);
            this.exibirRota(origem, destino, maps);
          },
          (error) => {
            // Se não conseguir obter localização, apenas mostra o destino
            console.warn('Não foi possível obter localização atual do navegador:', error.message);
            console.log('Exibindo apenas o destino no mapa');
          },
          {
            enableHighAccuracy: true, // Usa GPS quando disponível (celular)
            timeout: 10000, // Timeout de 10 segundos
            maximumAge: 0 // Não usa cache, sempre busca localização atual
          }
        );
      } else {
        if (!navigator.geolocation) {
          console.warn('Geolocalização não suportada pelo navegador');
        }
        if (!maps.DirectionsService) {
          console.warn('Biblioteca Directions não disponível');
        }
      }
    } catch (error) {
      console.error('Erro ao inicializar mapa:', error);
      this.carregandoMapa.set(false);
      this.cdr.markForCheck();
    } finally {
      this.carregandoMapa.set(false);
      this.cdr.markForCheck();
    }
  }

  private exibirRota(origem: { lat: number; lng: number }, destino: { lat: number; lng: number }, maps: any): void {
    if (!maps.DirectionsService || !maps.DirectionsRenderer) {
      console.warn('Biblioteca Directions não está disponível');
      return;
    }

    const directionsService = new maps.DirectionsService();
    const directionsRenderer = new maps.DirectionsRenderer({
      map: this.map,
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
      (result: any, status: any) => {
        if (status === 'OK') {
          directionsRenderer.setDirections(result);
          
          // Ajusta o zoom para mostrar toda a rota
          const bounds = new maps.LatLngBounds();
          result.routes[0].legs.forEach((leg: any) => {
            bounds.extend(leg.start_location);
            bounds.extend(leg.end_location);
          });
          this.map?.fitBounds(bounds);
        } else {
          console.warn('Erro ao calcular rota:', status);
          // Se houver erro, pelo menos mostra o destino centralizado
          if (this.map) {
            this.map.setCenter(destino);
            this.map.setZoom(16);
          }
        }
      }
    );
  }

  private limparMapa(): void {
    if (this.marker) {
      this.marker.setMap(null);
      this.marker = null;
    }
    this.map = null;
  }

  abrirNoGoogleMaps(): void {
    if (!this.latitude() || !this.longitude()) {
      return;
    }

    // Tenta abrir no app do Google Maps (mobile) ou web (desktop)
    this.googleMapsService.abrirRotaComLocalizacaoAtual(
      this.latitude()!,
      this.longitude()!
    );
  }

  fechar(): void {
    this.onFechar.emit();
  }
}

