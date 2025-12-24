import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

/**
 * Interface para requisição de atualização de localização.
 */
export interface AtualizarLocalizacaoRequest {
  latitude: number;
  longitude: number;
  heading?: number | null;
  velocidade?: number | null;
}

/**
 * Serviço para envio contínuo de localização do motoboy.
 * 
 * Funcionalidades:
 * - Envio automático de localização enquanto motoboy está logado
 * - Suporte a PWA (funciona em segundo plano quando possível)
 * - Throttling inteligente (só envia se houve movimento significativo)
 */
@Injectable({
  providedIn: 'root'
})
export class MotoboyRastreamentoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/motoboys`;
  
  private watchId: number | null = null;
  private ultimaLocalizacaoEnviada: { lat: number; lng: number } | null = null;
  private ultimoEnvioTimestamp = 0;
  private readonly MIN_DISTANCIA_METROS = 10; // Mínimo de 10 metros para enviar
  private readonly MIN_INTERVALO_SEGUNDOS = 5; // Mínimo de 5 segundos entre envios
  private motoboyIdAtivo: string | null = null;

  /**
   * Inicia envio contínuo de localização.
   * Usa watchPosition para monitorar mudanças de localização.
   * 
   * @param motoboyId ID do motoboy autenticado
   */
  iniciarRastreamento(motoboyId: string): void {
    if (this.watchId !== null) {
      console.warn('[Rastreamento Motoboy] Já está rastreando');
      return;
    }

    if (!navigator.geolocation) {
      console.error('[Rastreamento Motoboy] Geolocalização não suportada');
      return;
    }

    this.motoboyIdAtivo = motoboyId;
    console.log('[Rastreamento Motoboy] Iniciando rastreamento para motoboy:', motoboyId);

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        this.processarLocalizacao(position, motoboyId);
      },
      (error) => {
        console.error('[Rastreamento Motoboy] Erro ao obter localização:', error);
        // Não para o rastreamento em caso de erro temporário
      },
      {
        enableHighAccuracy: true, // Usa GPS quando disponível
        maximumAge: 0, // Não usa cache
        timeout: 20000 // Timeout de 20 segundos
      }
    );
  }

  /**
   * Para o envio de localização.
   */
  pararRastreamento(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
      this.ultimaLocalizacaoEnviada = null;
      this.motoboyIdAtivo = null;
      console.log('[Rastreamento Motoboy] Rastreamento parado');
    }
  }

  /**
   * Processa localização recebida e decide se deve enviar ao backend.
   */
  private processarLocalizacao(position: GeolocationPosition, motoboyId: string): void {
    const agora = Date.now();
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    const heading = position.coords.heading ?? null;
    const velocidade = position.coords.speed ? position.coords.speed * 3.6 : null; // Converte m/s para km/h

    // Verifica se deve enviar (throttling)
    const deveEnviar = this.deveEnviarLocalizacao(lat, lng, agora);

    if (!deveEnviar) {
      return; // Ignora esta localização
    }

    // Prepara requisição
    const request: AtualizarLocalizacaoRequest = {
      latitude: lat,
      longitude: lng,
      heading: heading,
      velocidade: velocidade
    };

    // Envia ao backend
    this.enviarLocalizacao(motoboyId, request).subscribe({
      next: () => {
        // Atualiza estado após envio bem-sucedido
        this.ultimaLocalizacaoEnviada = { lat, lng };
        this.ultimoEnvioTimestamp = agora;
        console.debug('[Rastreamento Motoboy] Localização enviada:', { lat, lng, heading, velocidade });
      },
      error: (err) => {
        console.warn('[Rastreamento Motoboy] Erro ao enviar localização:', err);
        // Não atualiza estado em caso de erro (pode tentar novamente na próxima)
      }
    });
  }

  /**
   * Verifica se deve enviar localização baseado em distância e tempo.
   */
  private deveEnviarLocalizacao(lat: number, lng: number, timestamp: number): boolean {
    // Primeira localização sempre envia
    if (!this.ultimaLocalizacaoEnviada) {
      return true;
    }

    // Verifica intervalo mínimo
    const tempoDesdeUltimoEnvio = (timestamp - this.ultimoEnvioTimestamp) / 1000; // em segundos
    if (tempoDesdeUltimoEnvio < this.MIN_INTERVALO_SEGUNDOS) {
      return false;
    }

    // Verifica distância mínima
    const distancia = this.calcularDistancia(
      this.ultimaLocalizacaoEnviada.lat,
      this.ultimaLocalizacaoEnviada.lng,
      lat,
      lng
    );

    if (distancia < this.MIN_DISTANCIA_METROS) {
      return false; // Não se moveu o suficiente
    }

    return true;
  }

  /**
   * Calcula distância entre dois pontos em metros (fórmula de Haversine).
   */
  private calcularDistancia(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000; // Raio da Terra em metros
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Envia localização ao backend.
   */
  private enviarLocalizacao(motoboyId: string, request: AtualizarLocalizacaoRequest): Observable<void> {
    return this.http.post<void>(
      `${this.apiUrl}/${motoboyId}/localizacao`,
      request
    ).pipe(
      catchError((error) => {
        console.error('[Rastreamento Motoboy] Erro HTTP ao enviar localização:', error);
        return of(void 0); // Retorna void para não quebrar o fluxo
      })
    );
  }

  /**
   * Verifica se está rastreando atualmente.
   */
  estaRastreando(): boolean {
    return this.watchId !== null;
  }

  /**
   * Obtém ID do motoboy ativo (se houver).
   */
  getMotoboyIdAtivo(): string | null {
    return this.motoboyIdAtivo;
  }
}

