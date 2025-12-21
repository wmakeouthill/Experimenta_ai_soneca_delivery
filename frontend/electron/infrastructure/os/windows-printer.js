/**
 * Impressora Windows
 * Responsabilidade: Imprimir no Windows usando apenas spooler do Windows
 */

const { enviarParaRede } = require('./windows-network-printer');
const { enviarParaSpooler } = require('./windows-spooler-printer');
const { enviarDiretoParaUSB } = require('./windows-usb-direct');

/**
 * Imprime no Windows usando apenas spooler do Windows
 * @param {Buffer} dados - Dados ESC/POS para imprimir
 * @param {string} devicePath - Caminho do dispositivo (IP:PORTA ou nome da impressora)
 * @param {string|null} nomeImpressora - Nome real da impressora (opcional)
 * @returns {Promise<{sucesso: boolean, erro?: string}>}
 */
/**
 * Verifica se impressora é autenticadora pelo nome ou driver
 */
async function isImpressoraAutenticadora(nomeImpressora, devicePath) {
  if (!nomeImpressora) return false;
  const nomeUpper = nomeImpressora.toUpperCase();

  // Verifica pelo nome da impressora
  if (nomeUpper.includes('DIEBOLD') ||
    nomeUpper.includes('DARUMA') ||
    nomeUpper.includes('AUTENTICADORA')) {
    return true;
  }

  // Verifica pelo driver (Diebold tem driver específico)
  try {
    const { verificarConfiguracaoImpressora } = require('./windows-spooler-debug');
    const config = await verificarConfiguracaoImpressora(nomeImpressora);
    if (config && config.driver) {
      const driverUpper = config.driver.toUpperCase();
      if (driverUpper.includes('DIEBOLD') ||
        driverUpper.includes('PROCOMP') ||
        driverUpper.includes('IM693')) {
        return true;
      }
    }
  } catch (error) {
    // Se não conseguir verificar driver, continua sem detectar como autenticadora
    console.warn(`⚠️ Não foi possível verificar driver da impressora: ${error.message}`);
  }

  return false;
}

/**
 * Decide método de impressão baseado no tipo de impressora
 */
async function imprimirWindows(dados, devicePath, nomeImpressora = null) {
  try {
    const mensagemImpressao = nomeImpressora
      ? `🪟 Windows: Tentando imprimir em "${devicePath}" (nome: "${nomeImpressora}")`
      : `🪟 Windows: Tentando imprimir em "${devicePath}"`;
    console.log(mensagemImpressao);

    // 1. Rede: IP:PORTA
    if (devicePath.includes(':') && /^\d+\.\d+\.\d+\.\d+:\d+$/.test(devicePath)) {
      console.log(`🌐 Enviando para impressora de rede: ${devicePath}`);
      return await enviarParaRede(dados, devicePath);
    }

    // 2. USB: Sempre usar spooler (USB001/USB002 são portas virtuais)
    if (devicePath && devicePath.toUpperCase().startsWith('USB')) {
      const isAutenticadora = await isImpressoraAutenticadora(nomeImpressora, devicePath).catch(() => false);

      if (isAutenticadora) {
        console.log(`🔌 Impressora autenticadora Diebold detectada pelo driver.`);
        console.log(`💡 Usando spooler do Windows com nome da impressora para USB (porta virtual).`);
      } else {
        console.log(`🔌 Impressora USB detectada.`);
        console.log(`💡 Usando spooler do Windows com nome da impressora para USB (porta virtual).`);
      }
      console.log(`⚠️ ATENÇÃO: Portas USB (USB001, USB002) são virtuais e não podem ser acessadas diretamente.`);

      return await enviarParaSpooler(dados, devicePath, nomeImpressora);
    }

    // 3. Outros (COM, etc.): spooler
    console.log(`🖨️ Usando spooler do Windows.`);
    return await enviarParaSpooler(dados, devicePath, nomeImpressora);

  } catch (error) {
    console.error(`❌ Erro em imprimirWindows:`, error);
    return { sucesso: false, erro: error.message };
  }
}

module.exports = {
  imprimirWindows
};
