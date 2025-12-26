import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, switchMap, of, tap } from 'rxjs';
import { ElectronImpressoraService } from './electron-impressora.service';

export enum TipoImpressora {
  // Epson (padrão ESC/POS)
  EPSON_TM_T20 = 'EPSON_TM_T20',
  EPSON_TM_T88 = 'EPSON_TM_T88',

  // Daruma
  DARUMA_800 = 'DARUMA_800',
  DARUMA_700 = 'DARUMA_700',

  // Diebold Nixdorf
  DIEBOLD_IM693H = 'DIEBOLD_IM693H',

  // Star
  STAR_TSP100 = 'STAR_TSP100',
  STAR_TSP650 = 'STAR_TSP650',

  // Bematech
  BEMATECH_MP4200 = 'BEMATECH_MP4200',

  // Elgin
  ELGIN_I9 = 'ELGIN_I9',
  ELGIN_I7 = 'ELGIN_I7',

  // Genéricas (chinesas/POS-58)
  POS_58 = 'POS_58',
  POS_80 = 'POS_80',
  GENERICA_ESCPOS = 'GENERICA_ESCPOS'
}

export interface ImprimirCupomRequest {
  pedidoId: string;
  tipoImpressora: TipoImpressora;
  nomeImpressora?: string;
  devicePath?: string; // Device path da impressora (opcional, busca do banco se não fornecido)
  nomeEstabelecimento?: string;
  enderecoEstabelecimento?: string;
  telefoneEstabelecimento?: string;
  cnpjEstabelecimento?: string;
}

export interface ImprimirCupomResponse {
  sucesso: boolean;
  mensagem: string;
  dataImpressao: string;
  pedidoId: string;
}

export interface FormatarCupomResponse {
  sucesso: boolean;
  mensagem: string;
  dadosEscPosBase64: string; // Dados do cupom formatados em ESC/POS (base64)
  logoBase64?: string; // Logo em base64 (PNG) para impressão separada pelo Electron
  tipoImpressora: string;
  pedidoId: string;
}

export interface ConfiguracaoImpressoraDTO {
  id?: string;
  tipoImpressora: TipoImpressora;
  devicePath?: string;
  larguraPapel?: number;
  tamanhoFonte?: 'PEQUENA' | 'NORMAL' | 'GRANDE';
  nomeEstabelecimento: string;
  enderecoEstabelecimento?: string;
  telefoneEstabelecimento?: string;
  cnpjEstabelecimento?: string;
  logoBase64?: string;
  ativa?: boolean;
}

export interface SalvarConfiguracaoImpressoraRequest {
  tipoImpressora: TipoImpressora;
  devicePath?: string;
  larguraPapel?: number;
  tamanhoFonte?: 'PEQUENA' | 'NORMAL' | 'GRANDE';
  nomeEstabelecimento: string;
  enderecoEstabelecimento?: string;
  telefoneEstabelecimento?: string;
  cnpjEstabelecimento?: string;
  logoBase64?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ImpressaoService {
  private readonly http = inject(HttpClient);
  private readonly electronImpressoraService = inject(ElectronImpressoraService);
  private readonly apiUrl = '/api/impressao';

  /**
   * Imprime cupom fiscal
   * Se estiver no Electron, formata no backend e imprime localmente via Electron
   * Se não estiver no Electron, tenta imprimir via backend (rede ou erro se local)
   */
  imprimirCupom(request: ImprimirCupomRequest): Observable<ImprimirCupomResponse> {
    // Se estiver no Electron, usa fluxo otimizado:
    // 1. Backend formata o cupom
    // 2. Frontend envia para Electron local imprimir
    if (this.electronImpressoraService.estaRodandoNoElectron()) {
      return this.imprimirViaElectron(request);
    }

    // Se não estiver no Electron, usa fluxo normal (backend tenta imprimir)
    return this.http.post<ImprimirCupomResponse>(`${this.apiUrl}/cupom-fiscal`, request);
  }

  /**
   * Fluxo otimizado para Electron:
   * 1. Backend formata o cupom e retorna dados em ESC/POS (base64)
   * 2. Frontend envia para servidor local do Electron (localhost:3001)
   * 3. Electron imprime localmente
   */
  private imprimirViaElectron(request: ImprimirCupomRequest): Observable<ImprimirCupomResponse> {
    // Se devicePath não foi fornecido, busca do banco primeiro
    if (!request.devicePath) {
      return this.buscarConfiguracao().pipe(
        switchMap((config) => {
          // Atualiza request com devicePath do banco
          const requestComDevicePath = {
            ...request,
            devicePath: config?.devicePath || undefined
          };
          return this.imprimirViaElectronComDevicePath(requestComDevicePath);
        })
      );
    }

    return this.imprimirViaElectronComDevicePath(request);
  }

  /**
   * Executa impressão via Electron com devicePath já definido
   */
  private imprimirViaElectronComDevicePath(request: ImprimirCupomRequest): Observable<ImprimirCupomResponse> {
    // 1. Formata cupom no backend
    return this.http.post<FormatarCupomResponse>(`${this.apiUrl}/cupom-fiscal/formatar`, request)
      .pipe(
        switchMap((formatarResponse) => {
          if (!formatarResponse.sucesso) {
            return of({
              sucesso: false,
              mensagem: formatarResponse.mensagem || 'Erro ao formatar cupom',
              dataImpressao: new Date().toISOString(),
              pedidoId: request.pedidoId
            } as ImprimirCupomResponse);
          }

          // Valida se devicePath está disponível
          if (!request.devicePath) {
            return of({
              sucesso: false,
              mensagem: 'devicePath não configurado. Configure uma impressora antes de imprimir.',
              dataImpressao: new Date().toISOString(),
              pedidoId: request.pedidoId
            } as ImprimirCupomResponse);
          }

          // 2. Obtém porta do servidor local do Electron
          return from(this.obterPortaServidorElectron()).pipe(
            switchMap((porta) => {
              if (!porta) {
                return of({
                  sucesso: false,
                  mensagem: 'Servidor de impressão do Electron não está disponível',
                  dataImpressao: new Date().toISOString(),
                  pedidoId: request.pedidoId
                } as ImprimirCupomResponse);
              }

              // 3. Envia para servidor local do Electron imprimir
              console.log('📤 Enviando para servidor Electron:', {
                porta,
                pedidoId: request.pedidoId,
                devicePath: request.devicePath,
                dadosCupomLength: formatarResponse.dadosEscPosBase64?.length,
                hasLogo: !!formatarResponse.logoBase64
              });

              return this.http.post<ImprimirCupomResponse>(
                `http://localhost:${porta}/imprimir/cupom-fiscal`,
                {
                  pedidoId: request.pedidoId,
                  tipoImpressora: formatarResponse.tipoImpressora,
                  devicePath: request.devicePath,
                  dadosCupom: formatarResponse.dadosEscPosBase64,
                  logoBase64: formatarResponse.logoBase64 // Logo PNG para impressão
                }
              ).pipe(
                tap({
                  next: (response) => console.log('✅ Resposta do servidor Electron:', response),
                  error: (error) => console.error('❌ Erro ao enviar para servidor Electron:', error)
                })
              );
            })
          );
        })
      );
  }

  /**
   * Obtém a porta do servidor local do Electron
   */
  private async obterPortaServidorElectron(): Promise<number | null> {
    try {
      if (!window.electronAPI?.obterPortaServidorImpressao) {
        return null;
      }
      const resultado = await window.electronAPI.obterPortaServidorImpressao();
      if (resultado.sucesso && resultado.porta != null) {
        return resultado.porta;
      }
      return null;
    } catch (error) {
      console.error('Erro ao obter porta do servidor Electron:', error);
      return null;
    }
  }

  imprimirCupomTeste(configuracao: {
    tipoImpressora: TipoImpressora;
    devicePath?: string; // Device path para teste (pode ser diferente do salvo)
    nomeEstabelecimento: string;
    enderecoEstabelecimento?: string;
    telefoneEstabelecimento?: string;
    cnpjEstabelecimento?: string;
  }): Observable<ImprimirCupomResponse> {
    const request: ImprimirCupomRequest = {
      pedidoId: 'teste', // ID especial para teste
      tipoImpressora: configuracao.tipoImpressora,
      devicePath: configuracao.devicePath, // Passa o devicePath para o backend
      nomeEstabelecimento: configuracao.nomeEstabelecimento,
      enderecoEstabelecimento: configuracao.enderecoEstabelecimento,
      telefoneEstabelecimento: configuracao.telefoneEstabelecimento,
      cnpjEstabelecimento: configuracao.cnpjEstabelecimento
    };

    return this.imprimirCupom(request);
  }

  buscarConfiguracao(): Observable<ConfiguracaoImpressoraDTO> {
    return this.http.get<ConfiguracaoImpressoraDTO>(`${this.apiUrl}/configuracao`);
  }

  salvarConfiguracao(request: SalvarConfiguracaoImpressoraRequest): Observable<ConfiguracaoImpressoraDTO> {
    return this.http.post<ConfiguracaoImpressoraDTO>(`${this.apiUrl}/configuracao`, request);
  }
}

