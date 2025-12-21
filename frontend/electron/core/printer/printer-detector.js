/**
 * Detector de Impressoras
 * Responsabilidade: Listar impressoras disponíveis no sistema operacional
 */

const { executarComando } = require('../../utils/exec-utils');
const { listarImpressorasWindows } = require('./platforms/windows-detector');
const { listarImpressorasLinux } = require('./platforms/linux-detector');
const { listarImpressorasMacOS } = require('./platforms/macos-detector');

/**
 * Lista todas as impressoras disponíveis no sistema
 * @returns {Promise<Array<{name: string, devicePath: string, status: string, padrao: boolean, tipo: string}>>}
 */
async function listarImpressorasDisponiveis() {
  try {
    const plataforma = process.platform;

    if (plataforma === 'win32') {
      return await listarImpressorasWindows();
    } else if (plataforma === 'linux') {
      return await listarImpressorasLinux();
    } else if (plataforma === 'darwin') {
      return await listarImpressorasMacOS();
    } else {
      console.warn(`⚠️ Plataforma não suportada: ${plataforma}`);
      return [];
    }
  } catch (error) {
    console.error('❌ Erro ao listar impressoras:', error);
    return [];
  }
}

module.exports = {
  listarImpressorasDisponiveis
};

