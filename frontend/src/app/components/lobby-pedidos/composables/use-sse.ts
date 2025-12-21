import { signal } from '@angular/core';

interface SSEMessage {
  tipo?: string;
  dados?: any;
}

class SSEManager {
  private eventSource: EventSource | null = null;
  private reconnectAttempts = signal(0);
  private readonly maxReconnectAttempts = 5;
  private readonly reconnectDelay = 1000;
  private reconnectTimeout: any = null;
  readonly isConnected = signal(false);

  connect(onMessage: (data: any) => void, onError?: (error: any) => void) {
    if (this.eventSource) {
      this.disconnect();
    }

    try {
      this.eventSource = new EventSource('/api/cache/pedidos/stream');

      this.eventSource.addEventListener('pedidos-update', (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📡 SSE: Recebida atualização em tempo real (evento nomeado):', data);
          onMessage(data);
        } catch (error) {
          console.error('📡 SSE: Erro ao processar mensagem nomeada:', error);
        }
      });

      this.eventSource.onmessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📡 SSE: Recebida atualização em tempo real (evento padrão):', data);
          onMessage(data);
        } catch (error) {
          console.error('📡 SSE: Erro ao processar mensagem:', error);
        }
      };

      this.eventSource.onopen = () => {
        console.log('📡 SSE: Conexão estabelecida');
        this.reconnectAttempts.set(0);
        this.isConnected.set(true);
      };

      this.eventSource.onerror = (error) => {
        console.error('📡 SSE: Erro na conexão:', error);
        this.isConnected.set(false);
        if (onError) onError(error);

        if (this.reconnectAttempts() < this.maxReconnectAttempts) {
          this.reconnectAttempts.update(v => v + 1);
          console.log(`📡 SSE: Tentando reconectar em ${this.reconnectDelay}ms (tentativa ${this.reconnectAttempts()})`);
          this.reconnectTimeout = setTimeout(() => this.connect(onMessage, onError), this.reconnectDelay);
        } else {
          console.error('📡 SSE: Máximo de tentativas de reconexão atingido');
        }
      };
    } catch (error) {
      console.error('📡 SSE: Erro ao criar EventSource:', error);
      if (onError) onError(error);
    }
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      this.isConnected.set(false);
      console.log('📡 SSE: Conexão fechada');
    }
  }
}

let sseManagerInstance: SSEManager | null = null;

export function useSSE() {
  if (!sseManagerInstance) {
    sseManagerInstance = new SSEManager();
  }

  return {
    connect: (onMessage: (data: any) => void, onError?: (error: any) => void) => 
      sseManagerInstance!.connect(onMessage, onError),
    disconnect: () => sseManagerInstance!.disconnect(),
    isConnected: sseManagerInstance!.isConnected
  };
}

