/**
 * Preload Script - Ponte segura entre Main e Renderer
 * Expõe APIs do Electron para o Angular de forma segura
 */

const { contextBridge, ipcRenderer } = require('electron');

// Expõe APIs seguras para o renderer (Angular)
contextBridge.exposeInMainWorld('electronAPI', {
  /**
   * Lista todas as impressoras disponíveis
   */
  listarImpressoras: () => ipcRenderer.invoke('listar-impressoras'),
  
  /**
   * Obtém a impressora padrão
   */
  obterImpressoraPadrao: () => ipcRenderer.invoke('obter-impressora-padrao'),
  
  /**
   * Verifica se uma impressora está disponível
   */
  verificarImpressora: (devicePath) => ipcRenderer.invoke('verificar-impressora', devicePath),
  
  /**
   * Obtém a porta do servidor de impressão local
   */
  obterPortaServidorImpressao: () => ipcRenderer.invoke('obter-porta-servidor-impressao'),
  
  /**
   * Informações sobre a plataforma
   */
  plataforma: process.platform,
  
  /**
   * Versão do Electron
   */
  versao: process.versions.electron
});

