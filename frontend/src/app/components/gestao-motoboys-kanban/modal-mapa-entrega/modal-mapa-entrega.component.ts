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
  private markerAtual: any = null; // Marcador da localização atual durante a viagem
  private directionsRenderer: any = null;
  readonly carregandoMapa = signal<boolean>(false);
  private mapaInicializado = false;
  readonly viagemIniciada = signal<boolean>(false);
  private watchPositionId: number | null = null;
  private zoomOriginal: number = 16; // Zoom original antes de iniciar viagem
  private centerOriginal: any = null; // Centro original antes de iniciar viagem

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
          // Usa setTimeout para sair do contexto do effect antes de escrever signals
          setTimeout(() => {
            this.limparMapa();
            this.mapaInicializado = false;
            this.viagemIniciada.set(false);
          }, 0);
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

      // Salva configurações originais do mapa
      this.zoomOriginal = 16;
      this.centerOriginal = destino;

      // Tenta obter localização atual do navegador/celular e mostrar rota
      // Verifica se a biblioteca directions está disponível
      console.log('Verificando disponibilidade:', {
        temGeolocation: !!navigator.geolocation,
        temDirectionsService: !!maps.DirectionsService,
        temDirectionsRenderer: !!maps.DirectionsRenderer
      });

      if (navigator.geolocation && maps.DirectionsService && maps.DirectionsRenderer) {
        console.log('Solicitando localização atual do navegador/celular (GPS)...');
        // Tenta obter localização com GPS (alta precisão)
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const origem = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            const precisao = position.coords.accuracy;
            console.log('Localização obtida:', origem, 'Precisão:', precisao, 'metros');
            
            // Se a precisão for muito ruim (> 1000m), tenta novamente
            if (precisao > 1000) {
              console.warn('Precisão muito baixa, tentando novamente com GPS...');
              this.tentarObterLocalizacaoPrecisa(destino, maps);
            } else {
              this.exibirRota(origem, destino, maps);
            }
          },
          (error) => {
            console.warn('Erro ao obter localização:', error.message);
            // ✅ Timeout aumentado e tenta novamente
            this.tentarObterLocalizacaoPrecisa(destino, maps);
          },
          {
            enableHighAccuracy: true, // FORÇA uso de GPS
            timeout: 30000, // ✅ Aumentado para 30 segundos (era 20s)
            maximumAge: 0 // Não usa cache
          }
        );
      } else {
        if (!navigator.geolocation) {
          console.warn('Geolocalização não suportada pelo navegador');
        }
        if (!maps.DirectionsService) {
          console.error('Biblioteca DirectionsService não disponível - verifique se a API Directions está habilitada');
        }
        if (!maps.DirectionsRenderer) {
          console.error('Biblioteca DirectionsRenderer não disponível - verifique se a API Directions está habilitada');
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
      console.error('Biblioteca Directions não está disponível:', {
        temDirectionsService: !!maps.DirectionsService,
        temDirectionsRenderer: !!maps.DirectionsRenderer
      });
      return;
    }

    console.log('Calculando rota de', origem, 'para', destino);

    const directionsService = new maps.DirectionsService();
    this.directionsRenderer = new maps.DirectionsRenderer({
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
        travelMode: maps.TravelMode.DRIVING,
        optimizeWaypoints: false,
        avoidHighways: false,
        avoidTolls: false
      },
      (result: any, status: any) => {
        console.log('Status da rota:', status);
        if (status === 'OK') {
          console.log('Rota calculada com sucesso!');
          this.directionsRenderer.setDirections(result);
          
          // Ajusta o zoom para mostrar toda a rota
          const bounds = new maps.LatLngBounds();
          result.routes[0].legs.forEach((leg: any) => {
            bounds.extend(leg.start_location);
            bounds.extend(leg.end_location);
          });
          this.map?.fitBounds(bounds);
          
          // Adiciona marcador na origem (localização atual)
          if (this.markerAtual) {
            this.markerAtual.setMap(null);
          }
          this.markerAtual = new maps.Marker({
            position: origem,
            map: this.map,
            title: 'Sua localização atual',
            icon: {
              path: maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#4285F4',
              fillOpacity: 1,
              strokeColor: '#FFFFFF',
              strokeWeight: 2
            }
          });
        } else {
          console.error('Erro ao calcular rota:', status);
          // Se houver erro, pelo menos mostra o destino centralizado
          if (this.map) {
            this.map.setCenter(destino);
            this.map.setZoom(16);
          }
        }
      }
    );
  }

  /**
   * Tenta obter localização precisa com GPS
   */
  private tentarObterLocalizacaoPrecisa(destino: { lat: number; lng: number }, maps: any, tentativa: number = 0): void {
    const maxTentativas = 3;
    
    if (tentativa >= maxTentativas) {
      console.warn('Não foi possível obter localização precisa após múltiplas tentativas');
      // Mostra apenas o destino
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const origem = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        const precisao = position.coords.accuracy;
        console.log(`Tentativa ${tentativa + 1}: Localização obtida com precisão de ${precisao}m`);
        
        if (precisao <= 100) {
          // Precisão aceitável (<= 100m)
          this.exibirRota(origem, destino, maps);
        } else {
          // Precisão ainda ruim, tenta novamente
          setTimeout(() => {
            this.tentarObterLocalizacaoPrecisa(destino, maps, tentativa + 1);
          }, 2000);
        }
      },
      (error) => {
        console.warn(`Tentativa ${tentativa + 1} falhou:`, error.message);
        if (tentativa < maxTentativas - 1) {
          setTimeout(() => {
            this.tentarObterLocalizacaoPrecisa(destino, maps, tentativa + 1);
          }, 2000);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 30000, // ✅ Aumentado para 30 segundos (era 20s)
        maximumAge: 0
      }
    );
  }

  iniciarViagem(): void {
    if (!this.map || !this.latitude() || !this.longitude()) {
      return;
    }

    if (this.viagemIniciada()) {
      this.pararViagem();
      return;
    }

    this.viagemIniciada.set(true);
    const maps = (window as any).google?.maps;
    if (!maps || !maps.DirectionsService || !maps.DirectionsRenderer) {
      console.error('Google Maps Directions não disponível');
      this.viagemIniciada.set(false);
      return;
    }

    const destino = { lat: this.latitude()!, lng: this.longitude()! };

    // Salva configurações atuais antes de entrar em modo navegação
    this.zoomOriginal = this.map.getZoom();
    this.centerOriginal = this.map.getCenter();

    // ✅ Inicializa o DirectionsRenderer se ainda não foi inicializado
    if (!this.directionsRenderer) {
      this.directionsRenderer = new maps.DirectionsRenderer({
        map: this.map,
        suppressMarkers: false, // Mostra marcadores de origem e destino
        preserveViewport: false, // Permite ajustar viewport durante navegação
        polylineOptions: {
          strokeColor: '#4285F4',
          strokeWeight: 6,
          strokeOpacity: 0.8
        },
        markerOptions: {
          visible: true
        }
      });
    } else {
      // Garante que o renderer está no mapa
      this.directionsRenderer.setMap(this.map);
    }

    // Configura o mapa para modo navegação (visão de rua)
    this.map.setZoom(19); // Zoom muito próximo para navegação (visão de rua)
    this.map.setMapTypeId(maps.MapTypeId.ROADMAP); // Tipo de mapa para navegação
    this.map.setTilt(45); // Inclina o mapa para visão 3D (como GPS)
    this.map.setHeading(0); // Direção inicial

    let ultimaPosicao: { lat: number; lng: number } | null = null;
    let ultimaAtualizacaoRota = Date.now();
    const intervaloRecalculoRota = 10000; // Recalcula rota a cada 10 segundos
    let primeiraPosicaoObtida = false;

    // ✅ Função para calcular rota inicial assim que obtiver a primeira posição
    const calcularRotaInicial = (origem: { lat: number; lng: number }) => {
      if (!primeiraPosicaoObtida) {
        primeiraPosicaoObtida = true;
        console.log('Primeira posição obtida, calculando rota inicial...');
        this.recalcularRota(origem, destino, maps);
      }
    };

    // Inicia o tracking da localização em tempo real
    if (navigator.geolocation) {
      // ✅ Primeiro tenta obter a posição atual para calcular rota inicial
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const origem = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          ultimaPosicao = origem;
          calcularRotaInicial(origem);
          
          // Cria marcador da localização atual
          if (this.markerAtual) {
            this.markerAtual.setPosition(origem);
          } else {
            this.markerAtual = new maps.Marker({
              position: origem,
              map: this.map,
              title: 'Sua localização atual',
              icon: {
                path: maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: '#4285F4',
                fillOpacity: 1,
                strokeColor: '#FFFFFF',
                strokeWeight: 3
              }
            });
          }
        },
        (error) => {
          console.warn('Erro ao obter posição inicial:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000, // ✅ Aumentado para 15 segundos
          maximumAge: 0
        }
      );

      // ✅ Inicia watchPosition para atualização contínua
      this.watchPositionId = navigator.geolocation.watchPosition(
        (position) => {
          const origem = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          
          // Calcula rota inicial se ainda não foi calculada
          if (!primeiraPosicaoObtida) {
            calcularRotaInicial(origem);
          }
          
          // Atualiza o marcador da localização atual
          if (this.markerAtual) {
            this.markerAtual.setPosition(origem);
          } else {
            this.markerAtual = new maps.Marker({
              position: origem,
              map: this.map,
              title: 'Sua localização atual',
              icon: {
                path: maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: '#4285F4',
                fillOpacity: 1,
                strokeColor: '#FFFFFF',
                strokeWeight: 3
              }
            });
          }

          // Centraliza o mapa na localização atual (modo navegação)
          this.map.setCenter(origem);
          
          // Calcula o heading (direção) baseado no movimento
          if (ultimaPosicao) {
            const heading = this.calcularHeading(ultimaPosicao, origem);
            this.map.setHeading(heading); // Rotaciona o mapa na direção do movimento
          }
          
          // Recalcula a rota periodicamente ou se mudou muito de posição
          const agora = Date.now();
          const tempoDesdeUltimaAtualizacao = agora - ultimaAtualizacaoRota;
          const distanciaDesdeUltimaPosicao = ultimaPosicao ? this.calcularDistancia(origem, ultimaPosicao) : 0;
          const deveRecalcular = tempoDesdeUltimaAtualizacao >= intervaloRecalculoRota ||
            distanciaDesdeUltimaPosicao > 100; // Mais de 100 metros

          if (deveRecalcular && maps.DirectionsService) {
            ultimaAtualizacaoRota = agora;
            ultimaPosicao = origem;
            this.recalcularRota(origem, destino, maps);
          }
        },
        (error) => {
          console.error('Erro ao rastrear localização:', error);
          // ✅ Não para a viagem em caso de erro temporário
        },
        {
          enableHighAccuracy: true, // Usa GPS para navegação
          timeout: 15000, // ✅ Aumentado para 15 segundos (era 5s)
          maximumAge: 0 // Sempre busca localização atual
        }
      );
    } else {
      console.error('Geolocalização não suportada');
      this.viagemIniciada.set(false);
    }
  }

  /**
   * Calcula a distância entre dois pontos em metros (fórmula de Haversine)
   */
  private calcularDistancia(ponto1: { lat: number; lng: number }, ponto2: { lat: number; lng: number }): number {
    const R = 6371e3; // Raio da Terra em metros
    const φ1 = ponto1.lat * Math.PI / 180;
    const φ2 = ponto2.lat * Math.PI / 180;
    const Δφ = (ponto2.lat - ponto1.lat) * Math.PI / 180;
    const Δλ = (ponto2.lng - ponto1.lng) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  /**
   * Calcula o heading (direção) entre dois pontos em graus
   */
  private calcularHeading(ponto1: { lat: number; lng: number }, ponto2: { lat: number; lng: number }): number {
    const lat1 = ponto1.lat * Math.PI / 180;
    const lat2 = ponto2.lat * Math.PI / 180;
    const dLon = (ponto2.lng - ponto1.lng) * Math.PI / 180;

    const y = Math.sin(dLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

    const heading = Math.atan2(y, x) * 180 / Math.PI;
    return (heading + 360) % 360; // Normaliza para 0-360
  }

  /**
   * Recalcula a rota durante a navegação
   */
  private recalcularRota(origem: { lat: number; lng: number }, destino: { lat: number; lng: number }, maps: any): void {
    if (!maps.DirectionsService) {
      console.error('DirectionsService não disponível');
      return;
    }

    // ✅ Garante que o DirectionsRenderer existe
    if (!this.directionsRenderer) {
      this.directionsRenderer = new maps.DirectionsRenderer({
        map: this.map,
        suppressMarkers: false,
        preserveViewport: true, // ✅ Mantém viewport durante navegação (não ajusta zoom)
        polylineOptions: {
          strokeColor: '#4285F4',
          strokeWeight: 6,
          strokeOpacity: 0.8
        }
      });
    }

    const directionsService = new maps.DirectionsService();
    
    console.log('Recalculando rota de', origem, 'para', destino);
    
    directionsService.route(
      {
        origin: origem,
        destination: destino,
        travelMode: maps.TravelMode.DRIVING, // Modo de condução (moto/carro)
        optimizeWaypoints: false,
        avoidHighways: false,
        avoidTolls: false,
        provideRouteAlternatives: false // ✅ Apenas uma rota para melhor performance
      },
      (result: any, status: any) => {
        if (status === 'OK') {
          console.log('Rota recalculada com sucesso durante navegação');
          this.directionsRenderer.setDirections(result);
          // ✅ Mantém o mapa centralizado na localização atual (não ajusta bounds durante navegação)
          // O preserveViewport: true garante que o zoom e posição não mudem
        } else {
          console.warn('Erro ao recalcular rota durante navegação:', status);
          // ✅ Em caso de erro, mantém a rota anterior visível
        }
      }
    );
  }

  pararViagem(): void {
    this.viagemIniciada.set(false);
    if (this.watchPositionId !== null) {
      navigator.geolocation.clearWatch(this.watchPositionId);
      this.watchPositionId = null;
    }
  }

  /**
   * Limpa o mapa sem escrever signals (para uso dentro de effects)
   */
  private limparMapaSemSignals(): void {
    // Para o rastreamento de localização sem escrever signal
    if (this.watchPositionId !== null) {
      navigator.geolocation.clearWatch(this.watchPositionId);
      this.watchPositionId = null;
    }
    
    // Limpa os marcadores e renderizador
    if (this.marker) {
      this.marker.setMap(null);
      this.marker = null;
    }
    if (this.markerAtual) {
      this.markerAtual.setMap(null);
      this.markerAtual = null;
    }
    if (this.directionsRenderer) {
      this.directionsRenderer.setMap(null);
      this.directionsRenderer = null;
    }
    this.map = null;
  }

  /**
   * Limpa o mapa completamente (pode escrever signals)
   */
  private limparMapa(): void {
    this.pararViagem();
    if (this.marker) {
      this.marker.setMap(null);
      this.marker = null;
    }
    if (this.markerAtual) {
      this.markerAtual.setMap(null);
      this.markerAtual = null;
    }
    if (this.directionsRenderer) {
      this.directionsRenderer.setMap(null);
      this.directionsRenderer = null;
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

