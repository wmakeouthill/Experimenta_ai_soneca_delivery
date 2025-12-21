/**
 * Validador de Impressoras
 * Responsabilidade: Validar e mapear devicePath para impressora real
 */

const { listarImpressorasDisponiveis } = require('./printer-detector');
const fs = require('fs');

/**
 * Valida formato de devicePath (segurança)
 * @param {string} devicePath - DevicePath a validar
 * @returns {boolean} - true se válido, false caso contrário
 */
function validarFormatoDevicePath(devicePath) {
  // Bloqueia path traversal e caracteres perigosos
  if (devicePath.includes('..')) {
    return false;
  }
  
  // Permite formatos conhecidos
  const formatosValidos = [
    /^COM\d+$/i,                    // COM3, COM4, etc.
    /^\/dev\/[\w\/-]+$/,            // /dev/usb/lp0, etc.
    /^\d+\.\d+\.\d+\.\d+:\d+$/,     // 192.168.1.100:9100
    /^[\w\s-]+$/                     // Nome de impressora (letras, números, espaços, hífens)
  ];

  return formatosValidos.some(formato => formato.test(devicePath));
}

/**
 * Valida se dispositivo Linux existe
 * @param {string} devicePath - Caminho do dispositivo
 * @returns {boolean} - true se existe e tem permissão de escrita
 */
function validarDispositivoLinux(devicePath) {
  try {
    fs.accessSync(devicePath, fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Valida formato IP:PORTA
 * @param {string} devicePath - DevicePath a validar
 * @returns {boolean} - true se for IP:PORTA válido
 */
function validarFormatoRede(devicePath) {
  if (!devicePath.includes(':')) {
    return false;
  }

  const [ip, porta] = devicePath.split(':');
  const ipValido = /^\d+\.\d+\.\d+\.\d+$/.test(ip);
  const portaValida = /^\d+$/.test(porta);

  return ipValido && portaValida;
}

/**
 * Valida e mapeia o devicePath (referência) para o caminho real atual da impressora
 * @param {string} devicePathReferencia - DevicePath de referência (pode ser nome, COM, IP:PORTA, etc.)
 * @returns {Promise<{nome: string, devicePath: string}|string|null>} - Objeto com nome e devicePath, string simples, ou null
 */
async function validarEMapearDevicePath(devicePathReferencia) {
  try {
    // Validação básica de segurança
    if (!devicePathReferencia || devicePathReferencia.trim().length === 0) {
      return null;
    }

    const devicePathSanitizado = devicePathReferencia.trim();

    // Lista todas as impressoras disponíveis no sistema
    const impressorasDisponiveis = await listarImpressorasDisponiveis();

    if (impressorasDisponiveis.length === 0) {
      console.warn('⚠️ Nenhuma impressora disponível no sistema');
      // Se for IP:PORTA (rede), aceita mesmo sem estar na lista do sistema
      if (validarFormatoRede(devicePathSanitizado)) {
        console.log(`✅ DevicePath de rede aceito: ${devicePathSanitizado}`);
        return devicePathSanitizado;
      }
      return null;
    }

    console.log(`📋 Impressoras disponíveis (${impressorasDisponiveis.length}):`,
      impressorasDisponiveis.map(imp => `"${imp.name}" (${imp.devicePath})`));

    // Tenta encontrar a impressora por devicePath exato
    let impressoraEncontrada = impressorasDisponiveis.find(
      imp => imp.devicePath === devicePathSanitizado
    );

    // Se não encontrou, tenta encontrar por nome
    if (!impressoraEncontrada) {
      console.log(`🔍 Tentando encontrar por nome: "${devicePathSanitizado}"`);
      impressoraEncontrada = impressorasDisponiveis.find(
        imp => imp.name === devicePathSanitizado || imp.name.toLowerCase() === devicePathSanitizado.toLowerCase()
      );
    }

    // Se ainda não encontrou, tenta encontrar por devicePath parcial (contém)
    if (!impressoraEncontrada) {
      console.log(`🔍 Tentando encontrar por devicePath parcial: "${devicePathSanitizado}"`);
      impressoraEncontrada = impressorasDisponiveis.find(
        imp => imp.devicePath && imp.devicePath.includes(devicePathSanitizado)
      );
    }

    // Se ainda não encontrou, verifica se é um formato conhecido (COM, /dev/, IP:PORTA)
    if (!impressoraEncontrada) {
      // Porta COM (Windows)
      if (devicePathSanitizado.toUpperCase().startsWith('COM')) {
        const comNumber = devicePathSanitizado.toUpperCase().replace('COM', '');
        const encontradaPorCOM = impressorasDisponiveis.find(
          imp => imp.devicePath && imp.devicePath.toUpperCase().includes(`COM${comNumber}`)
        );
        if (encontradaPorCOM) {
          return encontradaPorCOM.devicePath;
        }
        // Se não encontrou, mas é um COM válido, retorna como está
        return devicePathSanitizado;
      }

      // Dispositivo Linux (/dev/)
      if (devicePathSanitizado.startsWith('/dev/')) {
        if (validarDispositivoLinux(devicePathSanitizado)) {
          return devicePathSanitizado;
        }
        return null;
      }

      // IP:PORTA (impressora de rede)
      if (validarFormatoRede(devicePathSanitizado)) {
        return devicePathSanitizado;
      }

      // Se chegou aqui, não encontrou a impressora
      // Mas se for um formato que parece ser válido, aceita como está
      if (validarFormatoDevicePath(devicePathSanitizado)) {
        console.warn(`⚠️ Impressora não encontrada na lista, mas usando devicePath como está: "${devicePathSanitizado}"`);
        return devicePathSanitizado;
      }

      console.warn(`⚠️ Impressora não encontrada: "${devicePathSanitizado}"`);
      console.log('📋 Impressoras disponíveis:', impressorasDisponiveis.map(imp => `"${imp.name}" (${imp.devicePath})`));
      return null;
    }

    // Retorna objeto com nome e devicePath para usar na impressão
    console.log(`✅ Impressora encontrada: "${impressoraEncontrada.name}" (devicePath: ${impressoraEncontrada.devicePath})`);
    return {
      nome: impressoraEncontrada.name,
      devicePath: impressoraEncontrada.devicePath
    };
  } catch (error) {
    console.error('❌ Erro ao validar/mapear devicePath:', error);
    // Em caso de erro, tenta usar o devicePath original como fallback
    // Mas apenas se for um formato seguro
    if (devicePathReferencia.toUpperCase().startsWith('COM') ||
        devicePathReferencia.startsWith('/dev/') ||
        devicePathReferencia.includes(':')) {
      console.warn('⚠️ Usando devicePath original como fallback:', devicePathReferencia);
      return devicePathReferencia;
    }
    return null;
  }
}

module.exports = {
  validarEMapearDevicePath,
  validarFormatoDevicePath,
  validarFormatoRede,
  validarDispositivoLinux
};

