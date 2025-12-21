/**
 * Helper para Windows Spooler
 * Responsabilidade: Funções auxiliares para impressão via spooler
 */

const { listarImpressorasDisponiveis } = require('../../core/printer/printer-detector');
const { executarComando } = require('../../utils/exec-utils');

/**
 * Busca impressora na lista pelo devicePath ou nome
 * @param {Array} impressoras - Lista de impressoras disponíveis
 * @param {string} devicePath - DevicePath ou nome a buscar
 * @returns {Object|null} - Impressora encontrada ou null
 */
function buscarImpressoraPorDevicePath(impressoras, devicePath) {
  // Busca por devicePath exato (case insensitive)
  let encontrada = impressoras.find(imp => 
    imp.devicePath && imp.devicePath.toUpperCase() === devicePath.toUpperCase()
  );
  
  if (encontrada) return encontrada;
  
  // Busca por nome exato (case insensitive)
  encontrada = impressoras.find(imp => 
    imp.name && imp.name.toLowerCase() === devicePath.toLowerCase()
  );
  
  if (encontrada) return encontrada;
  
  // Busca por devicePath parcial
  encontrada = impressoras.find(imp => 
    (imp.devicePath && imp.devicePath.includes(devicePath)) ||
    (imp.devicePath && devicePath.includes(imp.devicePath))
  );
  
  return encontrada || null;
}

/**
 * Obtém o nome real da impressora a partir do devicePath
 * 
 * IMPORTANTE: Win32 API OpenPrinter() requer o NOME EXATO da impressora,
 * não apenas o devicePath. O Windows usa o nome para identificar a impressora
 * no spooler. O devicePath (COM3, USB001, etc.) não é suficiente.
 * 
 * @param {string} devicePath - DevicePath de referência (ex: USB001, COM3, ou nome da impressora)
 * @param {string|null} nomeImpressora - Nome da impressora (opcional, já fornecido e priorizado)
 * @returns {Promise<string>} - Nome real da impressora como registrado no Windows
 */
async function obterNomeImpressora(devicePath, nomeImpressora = null) {
  if (nomeImpressora && nomeImpressora.trim().length > 0) {
    console.log(`✅ Usando nome de impressora fornecido: "${nomeImpressora}"`);
    return nomeImpressora;
  }

  const impressoras = await listarImpressorasDisponiveis();

  if (impressoras.length === 0) {
    console.warn(`⚠️ Nenhuma impressora encontrada no sistema. Usando devicePath como fallback: "${devicePath}"`);
    return devicePath;
  }

  const impressoraEncontrada = buscarImpressoraPorDevicePath(impressoras, devicePath);

  if (impressoraEncontrada) {
    console.log(`✅ Impressora encontrada: "${impressoraEncontrada.name}" (devicePath: ${impressoraEncontrada.devicePath})`);
    return impressoraEncontrada.name;
  }

  console.warn(`⚠️ Impressora não encontrada na lista. Usando devicePath como nome: "${devicePath}"`);
  console.log(`📋 Impressoras disponíveis:`, impressoras.map(imp => `"${imp.name}" (${imp.devicePath})`).join(', '));
  return devicePath;
}

/**
 * Verifica se a impressora existe no sistema Windows
 * @param {string} nomeImpressora - Nome da impressora
 * @returns {Promise<boolean>} - true se existe, false caso contrário
 */
async function verificarImpressoraExiste(nomeImpressora) {
  try {
    const nomePSEscapado = nomeImpressora.replace(/'/g, "''").replace(/"/g, '`"');
    const comando = `powershell -Command "$printer = Get-Printer -Name '${nomePSEscapado}' -ErrorAction SilentlyContinue; if ($printer) { Write-Output 'EXISTS' } else { Write-Output 'NOT_FOUND' }"`;
    const { stdout } = await executarComando(comando, { timeout: 5000 });
    return stdout && stdout.includes('EXISTS');
  } catch (error) {
    console.warn(`⚠️ Erro ao verificar impressora: ${error.message || 'erro desconhecido'}`);
    return false;
  }
}

module.exports = {
  obterNomeImpressora,
  verificarImpressoraExiste,
  buscarImpressoraPorDevicePath
};

