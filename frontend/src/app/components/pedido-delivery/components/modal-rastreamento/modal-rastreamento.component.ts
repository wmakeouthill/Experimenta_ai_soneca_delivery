import { Component, inject, input, output, effect, signal, PLATFORM_ID, ChangeDetectionStrategy, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { BaseModalComponent } from '../../../cardapio/modals/base-modal/base-modal.component';
import { GoogleMapsService } from '../../../../services/google-maps.service';
import { RastreamentoPedidoResponse, LocalizacaoMotoboyDTO } from '../../../../services/rastreamento-pedido.service';

interface HistoricoLocalizacao {
  lat: number;
  lng: number;
  timestamp: Date;
}

/**
 * Modal para exibir rastreamento em tempo real do pedido.
 * Mostra localização do motoboy, destino, rota, ETA e histórico de localizações.
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
  private polylineRastro: any = null; // Linha do histórico de localizações
  private ultimaPosicaoMotoboy: { lat: number; lng: number } | null = null;
  private historicoLocalizacoes: HistoricoLocalizacao[] = [];
  private animacaoAtiva: any = null; // Referência para animação em andamento
  
  readonly carregandoMapa = signal<boolean>(false);
  readonly eta = signal<string | null>(null);
  readonly distancia = signal<string | null>(null);
  private mapaInicializado = false;

  constructor() {
    if (this.isBrowser) {
      // Effect para monitorar quando o modal abre/fecha e dados de rastreamento mudam
      // allowSignalWrites: true permite atualizar signals dentro do effect
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
            this.historicoLocalizacoes = [];
            this.ultimaPosicaoMotoboy = null;
          }, 0);
        }
      }, { allowSignalWrites: true });
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
      console.log('[Rastreamento] Dados inválidos ou sem coordenadas de destino');
      return;
    }

    const maps = (window as any).google?.maps;
    if (!maps) {
      console.warn('[Rastreamento] Google Maps API não disponível');
      return;
    }

    console.log('[Rastreamento] Dados recebidos:', {
      temLocalizacaoMotoboy: !!dados.localizacaoMotoboy,
      localizacaoValida: dados.localizacaoMotoboy?.valida,
      motoboyNome: dados.motoboyNome,
      latitudeDestino: dados.latitudeDestino,
      longitudeDestino: dados.longitudeDestino
    });

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
    if (dados.localizacaoMotoboy && dados.localizacaoMotoboy.latitude && dados.localizacaoMotoboy.longitude) {
      const motoboyPos = {
        lat: dados.localizacaoMotoboy.latitude,
        lng: dados.localizacaoMotoboy.longitude
      };

      console.log('[Rastreamento] Localização do motoboy:', motoboyPos, 'Valida:', dados.localizacaoMotoboy.valida);

      // Adiciona ao histórico se for uma nova localização
      if (!this.ultimaPosicaoMotoboy || 
          this.ultimaPosicaoMotoboy.lat !== motoboyPos.lat || 
          this.ultimaPosicaoMotoboy.lng !== motoboyPos.lng) {
        this.historicoLocalizacoes.push({
          lat: motoboyPos.lat,
          lng: motoboyPos.lng,
          timestamp: new Date()
        });
        this.ultimaPosicaoMotoboy = { ...motoboyPos };
      }

      // Cria ou atualiza marcador do motoboy com animação
      if (!this.markerMotoboy) {
        // Ícone de moto padrão do Google Maps (KML shapes)
        const iconMotoboy = {
          url: 'https://maps.google.com/mapfiles/kml/shapes/motorcycling.png',
          scaledSize: new maps.Size(48, 48),
          anchor: new maps.Point(24, 24)
        };

        this.markerMotoboy = new maps.Marker({
          position: motoboyPos,
          map: this.map,
          title: `Motoboy: ${dados.motoboyNome || 'Entregador'}`,
          icon: iconMotoboy,
          animation: maps.Animation.DROP
        });
      } else {
        // Atualiza rotação do ícone se tiver heading
        if (dados.localizacaoMotoboy.heading !== undefined && dados.localizacaoMotoboy.heading !== null) {
          const icon = this.markerMotoboy.getIcon();
          if (icon && typeof icon === 'object') {
            this.markerMotoboy.setIcon({
              ...icon,
              rotation: dados.localizacaoMotoboy.heading
            });
          }
        }
        
        // Anima movimento do marcador
        this.animarMovimentoMarcador(motoboyPos, maps);
      }

      // Atualiza rastro (linha do histórico)
      this.atualizarRastro(maps);

      // Atualiza rota e calcula ETA
      this.exibirRotaComETA(motoboyPos, destino, maps);
    } else {
      console.log('[Rastreamento] Sem localização do motoboy ainda');
      // Se não tem localização do motoboy, apenas centraliza no destino
      this.map.setCenter(destino);
      this.map.setZoom(16);
      this.eta.set(null);
      this.distancia.set(null);
    }
  }

  private animarMovimentoMarcador(novaPosicao: { lat: number; lng: number }, maps: any): void {
    if (!this.markerMotoboy || !this.ultimaPosicaoMotoboy) {
      return;
    }

    // Cancela animação anterior se existir
    if (this.animacaoAtiva) {
      clearInterval(this.animacaoAtiva);
    }

    const posicaoAtual = this.markerMotoboy.getPosition();
    if (!posicaoAtual) {
      this.markerMotoboy.setPosition(novaPosicao);
      return;
    }

    const latAtual = posicaoAtual.lat();
    const lngAtual = posicaoAtual.lng();
    const latDestino = novaPosicao.lat;
    const lngDestino = novaPosicao.lng;

    const distancia = this.calcularDistancia(latAtual, lngAtual, latDestino, lngDestino);
    
    // Se a distância for muito pequena, apenas atualiza sem animar
    if (distancia < 0.0001) {
      this.markerMotoboy.setPosition(novaPosicao);
      return;
    }

    // Animação suave do marcador
    const duracao = 1000; // 1 segundo
    const frames = 30;
    const intervalo = duracao / frames;
    let frameAtual = 0;

    this.animacaoAtiva = setInterval(() => {
      frameAtual++;
      const progresso = frameAtual / frames;
      const easeProgress = this.easeInOutCubic(progresso);

      const latInterpolada = latAtual + (latDestino - latAtual) * easeProgress;
      const lngInterpolada = lngAtual + (lngDestino - lngAtual) * easeProgress;

      this.markerMotoboy.setPosition({ lat: latInterpolada, lng: lngInterpolada });

      if (frameAtual >= frames) {
        clearInterval(this.animacaoAtiva);
        this.animacaoAtiva = null;
        this.markerMotoboy.setPosition(novaPosicao);
      }
    }, intervalo);
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  private calcularDistancia(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Raio da Terra em km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private calcularHeading(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const lat1Rad = lat1 * Math.PI / 180;
    const lat2Rad = lat2 * Math.PI / 180;
    
    const y = Math.sin(dLng) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - 
              Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);
    
    const heading = Math.atan2(y, x) * 180 / Math.PI;
    return (heading + 360) % 360; // Normaliza para 0-360
  }

  private atualizarRastro(maps: any): void {
    if (this.historicoLocalizacoes.length < 2) {
      return;
    }

    // Remove polyline anterior
    if (this.polylineRastro) {
      this.polylineRastro.setMap(null);
    }

    // Cria nova polyline com histórico
    const path = this.historicoLocalizacoes.map(loc => ({
      lat: loc.lat,
      lng: loc.lng
    }));

    this.polylineRastro = new maps.Polyline({
      path: path,
      geodesic: true,
      strokeColor: '#FF6B35',
      strokeOpacity: 0.6,
      strokeWeight: 3,
      map: this.map
    });
  }

  private exibirRotaComETA(origem: { lat: number; lng: number }, destino: { lat: number; lng: number }, maps: any): void {
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

          // Calcula ETA e distância
          const route = result.routes[0];
          let distanciaTotal = 0;
          let tempoTotal = 0;

          route.legs.forEach((leg: any) => {
            distanciaTotal += leg.distance.value; // em metros
            tempoTotal += leg.duration.value; // em segundos
          });

          // Formata distância
          if (distanciaTotal < 1000) {
            this.distancia.set(`${Math.round(distanciaTotal)}m`);
          } else {
            this.distancia.set(`${(distanciaTotal / 1000).toFixed(1)}km`);
          }

          // Formata ETA
          const minutos = Math.round(tempoTotal / 60);
          if (minutos < 1) {
            this.eta.set('menos de 1 minuto');
          } else if (minutos === 1) {
            this.eta.set('1 minuto');
          } else {
            this.eta.set(`${minutos} minutos`);
          }

          // Ajusta o zoom para mostrar toda a rota
          const bounds = new maps.LatLngBounds();
          route.legs.forEach((leg: any) => {
            bounds.extend(leg.start_location);
            bounds.extend(leg.end_location);
          });
          this.map.fitBounds(bounds);
          
          this.cdr.markForCheck();
        } else {
          console.warn('Erro ao calcular rota:', status);
          // Se houver erro, pelo menos mostra ambos os pontos
          const bounds = new maps.LatLngBounds();
          bounds.extend(origem);
          bounds.extend(destino);
          this.map.fitBounds(bounds);
          this.eta.set(null);
          this.distancia.set(null);
        }
      }
    );
  }

  private limparMapa(): void {
    // Cancela animação se estiver ativa
    if (this.animacaoAtiva) {
      clearInterval(this.animacaoAtiva);
      this.animacaoAtiva = null;
    }

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
    if (this.polylineRastro) {
      this.polylineRastro.setMap(null);
      this.polylineRastro = null;
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
