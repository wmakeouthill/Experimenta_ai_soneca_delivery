/**
 * Impressora Linux
 * Responsabilidade: Imprimir no Linux (USB, rede, CUPS)
 */

const fs = require('fs');
const net = require('net');
const { executarComando } = require('../../utils/exec-utils');
const { criarArquivoTemporario, removerArquivoTemporario } = require('../../utils/file-utils');

/**
 * Envia dados para dispositivo USB
 * @param {Buffer} dados - Dados ESC/POS binários
 * @param {string} devicePath - Caminho do dispositivo (ex: /dev/usb/lp0)
 * @returns {Promise<{sucesso: boolean, erro?: string}>}
 */
async function enviarParaUSB(dados, devicePath) {
  fs.writeFileSync(devicePath, dados);
  return { sucesso: true };
}

/**
 * Envia dados para impressora de rede
 * @param {Buffer} dados - Dados ESC/POS binários
 * @param {string} enderecoRede - Endereço IP:PORTA
 * @returns {Promise<{sucesso: boolean, erro?: string}>}
 */
async function enviarParaRede(dados, enderecoRede) {
  const [ip, porta] = enderecoRede.split(':');

  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.connect(parseInt(porta), ip, () => {
      socket.write(dados);
      socket.end();
      resolve({ sucesso: true });
    });

    socket.on('error', (error) => {
      resolve({ sucesso: false, erro: error.message });
    });

    socket.setTimeout(5000, () => {
      socket.destroy();
      resolve({ sucesso: false, erro: 'Timeout ao conectar na impressora' });
    });
  });
}

/**
 * Envia dados via CUPS (lp)
 * @param {Buffer} dados - Dados ESC/POS binários
 * @param {string} nomeImpressora - Nome da impressora CUPS
 * @returns {Promise<{sucesso: boolean, erro?: string}>}
 */
async function enviarViaCUPS(dados, nomeImpressora) {
  const arquivoTemp = criarArquivoTemporario(dados, 'cupom', '.prn');

  try {
    await executarComando(`lp -d "${nomeImpressora}" "${arquivoTemp}"`, { timeout: 10000 });
    return { sucesso: true };
  } finally {
    removerArquivoTemporario(arquivoTemp);
  }
}

/**
 * Imprime no Linux
 * @param {Buffer} dados - Dados ESC/POS para imprimir
 * @param {string} devicePath - Caminho do dispositivo (COM, IP:PORTA, /dev/, nome)
 * @returns {Promise<{sucesso: boolean, erro?: string}>}
 */
async function imprimirLinux(dados, devicePath) {
  try {
    // Se for dispositivo USB (/dev/usb/lp*)
    if (devicePath.startsWith('/dev/')) {
      return await enviarParaUSB(dados, devicePath);
    }

    // Se for IP:PORTA (rede)
    if (devicePath.includes(':')) {
      return await enviarParaRede(dados, devicePath);
    }

    // Se for nome de impressora CUPS
    return await enviarViaCUPS(dados, devicePath);
  } catch (error) {
    return { sucesso: false, erro: error.message };
  }
}

module.exports = {
  imprimirLinux
};

