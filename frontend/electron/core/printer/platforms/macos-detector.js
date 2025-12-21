/**
 * Detector de Impressoras - macOS
 * Responsabilidade: Listar impressoras no macOS usando lpstat
 */

const { executarComando } = require('../../../utils/exec-utils');

/**
 * Lista impressoras no macOS usando lpstat
 * @returns {Promise<Array<{name: string, devicePath: string, status: string, padrao: boolean, tipo: string}>>}
 */
async function listarImpressorasMacOS() {
  try {
    const { stdout } = await executarComando('lpstat -p -d', { timeout: 5000 });
    const linhas = stdout.split('\n').filter(l => l.trim());
    const impressoras = [];
    let impressoraPadrao = '';

    const padraoMatch = stdout.match(/system default destination:\s*(.+)/);
    if (padraoMatch) {
      impressoraPadrao = padraoMatch[1].trim();
    }

    for (const linha of linhas) {
      const match = linha.match(/printer\s+(\S+)/);
      if (match) {
        const nome = match[1];
        impressoras.push({
          name: nome,
          devicePath: nome,
          status: 'Disponível',
          padrao: nome === impressoraPadrao,
          tipo: 'macos'
        });
      }
    }

    return impressoras;
  } catch (error) {
    console.error('❌ Erro ao listar impressoras macOS:', error);
    return [];
  }
}

module.exports = {
  listarImpressorasMacOS
};

