import { inject, Injectable } from '@angular/core';

/**
 * Serviço para comunicação com Electron (quando rodando em Electron)
 * Permite detectar impressoras instaladas no sistema
 */

export interface ImpressoraSistema {
  name: string;
  devicePath: string;
  status: string;
  padrao: boolean;
  tipo: 'windows' | 'linux' | 'macos' | 'linux-usb';
}

declare global {
  interface Window {
    electronAPI?: {
      listarImpressoras: () => Promise<{ sucesso: boolean; impressoras: ImpressoraSistema[]; erro?: string }>;
      obterImpressoraPadrao: () => Promise<{ sucesso: boolean; impressora?: ImpressoraSistema; erro?: string }>;
      verificarImpressora: (devicePath: string) => Promise<{ sucesso: boolean; disponivel: boolean; impressora?: ImpressoraSistema }>;
      obterPortaServidorImpressao: () => Promise<{ sucesso: boolean; porta?: number; erro?: string }>;
      plataforma: string;
      versao: string;
    };
  }
}

@Injectable({
  providedIn: 'root'
})
export class ElectronImpressoraService {
  
  /**
   * Verifica se está rodando dentro do Electron
   */
  estaRodandoNoElectron(): boolean {
    return typeof window !== 'undefined' && !!window.electronAPI;
  }

  /**
   * Lista todas as impressoras disponíveis no sistema
   */
  async listarImpressoras(): Promise<ImpressoraSistema[]> {
    if (!this.estaRodandoNoElectron()) {
      console.warn('Não está rodando no Electron. Retornando lista vazia.');
      return [];
    }

    try {
      const resultado = await window.electronAPI!.listarImpressoras();
      if (resultado.sucesso) {
        return resultado.impressoras;
      } else {
        console.error('Erro ao listar impressoras:', resultado.erro);
        return [];
      }
    } catch (error) {
      console.error('Erro ao chamar Electron API:', error);
      return [];
    }
  }

  /**
   * Obtém a impressora padrão do sistema
   */
  async obterImpressoraPadrao(): Promise<ImpressoraSistema | null> {
    if (!this.estaRodandoNoElectron()) {
      return null;
    }

    try {
      const resultado = await window.electronAPI!.obterImpressoraPadrao();
      if (resultado.sucesso && resultado.impressora) {
        return resultado.impressora;
      }
      return null;
    } catch (error) {
      console.error('Erro ao obter impressora padrão:', error);
      return null;
    }
  }

  /**
   * Verifica se uma impressora está disponível
   */
  async verificarImpressora(devicePath: string): Promise<boolean> {
    if (!this.estaRodandoNoElectron()) {
      return false;
    }

    try {
      const resultado = await window.electronAPI!.verificarImpressora(devicePath);
      return resultado.sucesso && resultado.disponivel;
    } catch (error) {
      console.error('Erro ao verificar impressora:', error);
      return false;
    }
  }

  /**
   * Obtém informações da plataforma
   */
  obterPlataforma(): string | null {
    if (!this.estaRodandoNoElectron()) {
      return null;
    }
    return window.electronAPI!.plataforma;
  }
}

