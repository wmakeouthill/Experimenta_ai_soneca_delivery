/**
 * Impressora macOS
 * Responsabilidade: Imprimir no macOS usando CUPS (lpr)
 */

const { executarComando } = require('../../utils/exec-utils');
const { criarArquivoTemporario, removerArquivoTemporario } = require('../../utils/file-utils');

/**
 * Imprime no macOS
 * @param {Buffer} dados - Dados ESC/POS para imprimir
 * @param {string} devicePath - Nome da impressora CUPS
 * @returns {Promise<{sucesso: boolean, erro?: string}>}
 */
async function imprimirMacOS(dados, devicePath) {
  try {
    const arquivoTemp = criarArquivoTemporario(dados, 'cupom', '.prn');

    try {
      await executarComando(`lpr -P "${devicePath}" "${arquivoTemp}"`, { timeout: 10000 });
      return { sucesso: true };
    } finally {
      removerArquivoTemporario(arquivoTemp);
    }
  } catch (error) {
    return { sucesso: false, erro: error.message };
  }
}

module.exports = {
  imprimirMacOS
};

