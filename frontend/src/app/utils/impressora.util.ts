/**
 * Utilitários para ajudar o usuário a configurar impressoras.
 * Como aplicações web não podem detectar impressoras diretamente,
 * fornecemos métodos auxiliares e instruções.
 */

export interface InstrucoesImpressora {
  windows: string[];
  linux: string[];
  rede: string[];
}

/**
 * Instruções para descobrir o devicePath da impressora
 */
export class ImpressoraUtil {
  
  static obterInstrucoesDevicePath(): InstrucoesImpressora {
    return {
      windows: [
        '1. Conecte a impressora USB ao computador',
        '2. Abra o Gerenciador de Dispositivos (Win + X → Gerenciador de Dispositivos)',
        '3. Expanda "Portas (COM e LPT)"',
        '4. Procure pela sua impressora (ex: "USB Serial Port (COM3)")',
        '5. Anote o número da porta COM (ex: COM3, COM4)',
        '6. Use esse valor no campo "Caminho do Dispositivo"'
      ],
      linux: [
        '1. Conecte a impressora USB ao computador',
        '2. Execute no terminal: lsusb (para listar dispositivos USB)',
        '3. Execute no terminal: ls -la /dev/usb/ ou ls -la /dev/tty*',
        '4. Procure por dispositivos como /dev/usb/lp0, /dev/usb/lp1, etc',
        '5. Ou verifique: dmesg | grep tty (mostra dispositivos conectados)',
        '6. Use o caminho encontrado no campo "Caminho do Dispositivo"'
      ],
      rede: [
        '1. Descubra o IP da impressora (consulte o manual ou configure na impressora)',
        '2. Teste a conexão: ping [IP_DA_IMPRESSORA]',
        '3. Verifique se a porta padrão é 9100 (consulte o manual da impressora)',
        '4. Use o formato: IP:PORTA (ex: 192.168.1.100:9100)',
        '5. Cole no campo "Caminho do Dispositivo"'
      ]
    };
  }

  /**
   * Valida o formato do devicePath
   */
  static validarDevicePath(devicePath: string): { valido: boolean; erro?: string } {
    if (!devicePath || devicePath.trim().length === 0) {
      return { valido: true }; // Opcional
    }

    const path = devicePath.trim();

    // Formato rede: IP:PORTA
    const regexRede = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d+$/;
    if (regexRede.test(path)) {
      const [ip, porta] = path.split(':');
      const ipPartes = ip.split('.').map(Number);
      
      // Valida IP
      if (ipPartes.length !== 4 || ipPartes.some(p => p < 0 || p > 255)) {
        return { valido: false, erro: 'IP inválido' };
      }
      
      // Valida porta
      const portaNum = Number(porta);
      if (isNaN(portaNum) || portaNum < 1 || portaNum > 65535) {
        return { valido: false, erro: 'Porta inválida (deve ser entre 1 e 65535)' };
      }
      
      return { valido: true };
    }

    // Formato Windows: COM1, COM2, etc
    const regexCom = /^COM\d+$/i;
    if (regexCom.test(path)) {
      return { valido: true };
    }

    // Formato Linux: /dev/usb/lp0, /dev/ttyUSB0, etc
    const regexLinux = /^\/dev\/(usb\/lp\d+|ttyUSB\d+|ttyACM\d+)$/;
    if (regexLinux.test(path)) {
      return { valido: true };
    }

    return { 
      valido: false, 
      erro: 'Formato inválido. Use: IP:PORTA (rede), COMx (Windows) ou /dev/usb/lpx (Linux)' 
    };
  }

  /**
   * Detecta o sistema operacional do navegador (limitado)
   */
  static detectarSO(): 'windows' | 'linux' | 'mac' | 'desconhecido' {
    if (typeof window === 'undefined') {
      return 'desconhecido';
    }

    const userAgent = window.navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('win')) {
      return 'windows';
    }
    
    if (userAgent.includes('linux')) {
      return 'linux';
    }
    
    if (userAgent.includes('mac')) {
      return 'mac';
    }
    
    return 'desconhecido';
  }

  /**
   * Tenta usar a Web Printing API (experimental, suporte limitado)
   */
  static async tentarUsarWebPrintingAPI(): Promise<boolean> {
    if (typeof window === 'undefined') {
      return false;
    }

    // Verifica se a API está disponível (apenas Chrome/Edge)
    if ('navigator' in window && 'printing' in navigator) {
      try {
        // @ts-ignore - API experimental
        const printerList = await navigator.printing.getPrinters();
        return Array.isArray(printerList) && printerList.length > 0;
      } catch {
        return false;
      }
    }

    return false;
  }

  /**
   * Abre o diálogo de impressão do navegador
   * Nota: Isso abre o diálogo padrão do SO, mas não permite capturar a impressora selecionada
   */
  static abrirDialogoImpressao(): void {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }

  /**
   * Obtém um placeholder sugerido baseado no SO detectado
   */
  static obterPlaceholderSugerido(): string {
    const so = this.detectarSO();
    
    switch (so) {
      case 'windows':
        return 'COM3 (verifique no Gerenciador de Dispositivos)';
      case 'linux':
        return '/dev/usb/lp0 (verifique com: ls -la /dev/usb/)';
      case 'mac':
        return 'Consulte o manual da impressora para o caminho correto';
      default:
        return 'IP:PORTA (rede), COMx (Windows), /dev/usb/lpx (Linux)';
    }
  }
}

