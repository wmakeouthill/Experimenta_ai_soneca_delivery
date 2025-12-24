import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, interval, switchMap, takeWhile, EMPTY } from 'rxjs';
import { environment } from '../../environments/environment';

/**
 * Interface para resposta de rastreamento de pedido.
 */
export interface RastreamentoPedidoResponse {
  pedidoId: string;
  numeroPedido: string;
  statusPedido: string;
  motoboyId: string;
  motoboyNome: string;
  localizacaoMotoboy: LocalizacaoMotoboyDTO | null;
  latitudeDestino: number | null;
  longitudeDestino: number | null;
  enderecoEntrega: string;
  permiteRastreamento: boolean;
  ultimaAtualizacao: string;
}

/**
 * Interface para localização do motoboy.
 */
export interface LocalizacaoMotoboyDTO {
  latitude: number;
  longitude: number;
  heading?: number;
  velocidade?: number;
  timestamp: string;
  valida: boolean;
}

/**
 * Serviço para rastreamento de pedidos em tempo real.
 * 
 * Performance:
 * - Polling configurável (padrão: 5 segundos)
 * - SSE como alternativa (quando implementado)
 * - Cache local de última localização
 */
@Injectable({
  providedIn: 'root'
})
export class RastreamentoPedidoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/cliente/pedidos`;
  
  /**
   * Obtém dados de rastreamento de um pedido (polling).
   * 
   * @param pedidoId ID do pedido
   * @returns Observable com dados de rastreamento
   */
  obterRastreamento(pedidoId: string): Observable<RastreamentoPedidoResponse> {
    return this.http.get<RastreamentoPedidoResponse>(
      `${this.apiUrl}/${pedidoId}/rastreamento`
    );
  }
  
  /**
   * Inicia polling de rastreamento.
   * Retorna Observable que emite atualizações a cada intervalo.
   * 
   * @param pedidoId ID do pedido
   * @param intervaloMs Intervalo em milissegundos (padrão: 5000ms = 5 segundos)
   * @returns Observable que emite atualizações de rastreamento
   */
  iniciarPolling(
    pedidoId: string, 
    intervaloMs: number = 5000
  ): Observable<RastreamentoPedidoResponse> {
    return interval(intervaloMs).pipe(
      switchMap(() => this.obterRastreamento(pedidoId)),
      takeWhile(() => true) // Continua até ser cancelado
    );
  }
  
  /**
   * Conecta ao SSE stream para atualizações em tempo real.
   * TODO: Implementar quando SSE estiver disponível no backend.
   * 
   * @param pedidoId ID do pedido
   * @returns Observable com atualizações via SSE
   */
  conectarSSE(pedidoId: string): Observable<RastreamentoPedidoResponse> {
    // TODO: Implementar EventSource quando necessário
    // Por enquanto retorna vazio
    return EMPTY;
  }
}

