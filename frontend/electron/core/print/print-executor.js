/**
 * Executor de Impressão
 * Responsabilidade: Orquestrar impressão baseada na plataforma
 */

const { imprimirWindows } = require('../../infrastructure/os/windows-printer');
const { imprimirLinux } = require('../../infrastructure/os/linux-printer');
const { imprimirMacOS } = require('../../infrastructure/os/macos-printer');

/**
 * Imprime localmente usando o devicePath
 * @param {Buffer} dados - Dados ESC/POS para imprimir
 * @param {string} devicePath - Caminho do dispositivo (COM, IP:PORTA, /dev/, nome)
 * @param {string} tipoImpressora - Tipo da impressora
 * @param {string|null} nomeImpressora - Nome real da impressora (opcional, útil para Windows)
 * @returns {Promise<{sucesso: boolean, erro?: string}>}
 */
async function imprimirLocalmente(dados, devicePath, tipoImpressora, nomeImpressora = null) {
  try {
    const plataforma = process.platform;

    if (plataforma === 'win32') {
      return await imprimirWindows(dados, devicePath, nomeImpressora);
    } else if (plataforma === 'linux') {
      return await imprimirLinux(dados, devicePath);
    } else if (plataforma === 'darwin') {
      return await imprimirMacOS(dados, devicePath);
    } else {
      throw new Error(`Plataforma não suportada: ${plataforma}`);
    }
  } catch (error) {
    return { sucesso: false, erro: error.message };
  }
}

module.exports = {
  imprimirLocalmente
};

