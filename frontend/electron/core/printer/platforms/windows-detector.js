/**
 * Detector de Impressoras - Windows
 * Responsabilidade: Listar impressoras no Windows usando PowerShell
 */

const { executarComando } = require('../../../utils/exec-utils');

/**
 * Lista impressoras no Windows usando PowerShell
 * @returns {Promise<Array<{name: string, devicePath: string, status: string, padrao: boolean, tipo: string}>>}
 */
async function listarImpressorasWindows() {
  try {
    const comando = `powershell -Command "Get-WmiObject -Class Win32_Printer | Select-Object Name, PortName, Default, Status | ConvertTo-Json"`;
    const { stdout } = await executarComando(comando, { timeout: 5000, maxBuffer: 1024 * 1024 });
    const impressoras = JSON.parse(stdout);
    const lista = Array.isArray(impressoras) ? impressoras : [impressoras];

    return lista.map(imp => ({
      name: imp.Name || '',
      devicePath: imp.PortName || `COM${lista.indexOf(imp)}`,
      status: imp.Status || 'Desconhecido',
      padrao: imp.Default || false,
      tipo: 'windows'
    }));
  } catch (error) {
    console.error('❌ Erro ao listar impressoras Windows:', error);
    return [];
  }
}

module.exports = {
  listarImpressorasWindows
};

