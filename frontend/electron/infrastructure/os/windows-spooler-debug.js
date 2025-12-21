/**
 * Debug e diagnóstico para impressão
 * Responsabilidade: Ferramentas de debug para problemas de impressão
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Salva dados de debug para análise
 * @param {Buffer} dados - Dados ESC/POS
 * @param {string} nomeImpressora - Nome da impressora
 * @returns {string} - Caminho do arquivo de debug salvo
 */
function salvarDebug(dados, nomeImpressora) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dirDebug = path.join(os.tmpdir(), 'snackbar_print_debug');
  
  // Cria diretório se não existir
  if (!fs.existsSync(dirDebug)) {
    fs.mkdirSync(dirDebug, { recursive: true });
  }
  
  // Salva arquivo binário
  const arquivoBin = path.join(dirDebug, `cupom_${timestamp}.bin`);
  fs.writeFileSync(arquivoBin, dados);
  
  // Salva informações hexadecimais (primeiros 512 bytes)
  const preview = dados.slice(0, 512);
  const hex = Array.from(preview)
    .map(b => b.toString(16).padStart(2, '0').toUpperCase())
    .join(' ');
  
  const info = {
    timestamp: new Date().toISOString(),
    impressora: nomeImpressora,
    tamanho: dados.length,
    primeirosBytes: hex,
    arquivoBin: arquivoBin
  };
  
  const arquivoInfo = path.join(dirDebug, `info_${timestamp}.json`);
  fs.writeFileSync(arquivoInfo, JSON.stringify(info, null, 2));
  
  console.log(`🔍 Debug salvo: ${arquivoBin} (${dados.length} bytes)`);
  console.log(`📋 Info: ${arquivoInfo}`);
  console.log(`🔢 Primeiros bytes (hex): ${preview.slice(0, 32).toString('hex').toUpperCase()}`);
  
  return arquivoBin;
}

/**
 * Verifica configuração da impressora no Windows
 * @param {string} nomeImpressora - Nome da impressora
 * @returns {Promise<object>} - Informações da impressora
 */
async function verificarConfiguracaoImpressora(nomeImpressora) {
  const { executarComando } = require('../../utils/exec-utils');
  
  try {
    // Obtém informações detalhadas da impressora
    const nomeEscapado = nomeImpressora.replace(/'/g, "''");
    const comando = `powershell -Command "$printer = Get-Printer -Name '${nomeEscapado}' -ErrorAction SilentlyContinue; if ($printer) { Write-Output ('NOME:' + $printer.Name); Write-Output ('DRIVER:' + $printer.DriverName); Write-Output ('PORT:' + $printer.PortName); Write-Output ('SHARED:' + $printer.Shared); Write-Output ('PRINT_PROCESSOR:' + $printer.PrintProcessor); Write-Output ('DATATYPE:' + $printer.PrintProcessor) } else { Write-Output 'NOT_FOUND' }"`;
    
    const { stdout } = await executarComando(comando, { timeout: 5000 });
    
    if (stdout.includes('NOT_FOUND')) {
      return { encontrada: false };
    }
    
    const linhas = stdout.split('\n').filter(l => l.trim());
    const info = { encontrada: true };
    
    linhas.forEach(linha => {
      if (linha.startsWith('NOME:')) info.nome = linha.substring(5).trim();
      if (linha.startsWith('DRIVER:')) info.driver = linha.substring(7).trim();
      if (linha.startsWith('PORT:')) info.porta = linha.substring(5).trim();
      if (linha.startsWith('SHARED:')) info.compartilhada = linha.substring(7).trim();
      if (linha.startsWith('PRINT_PROCESSOR:')) info.processador = linha.substring(16).trim();
      if (linha.startsWith('DATATYPE:')) info.tipoDados = linha.substring(9).trim();
    });
    
    return info;
  } catch (error) {
    console.warn(`⚠️ Erro ao verificar configuração: ${error.message}`);
    return { erro: error.message };
  }
}

module.exports = {
  salvarDebug,
  verificarConfiguracaoImpressora
};

