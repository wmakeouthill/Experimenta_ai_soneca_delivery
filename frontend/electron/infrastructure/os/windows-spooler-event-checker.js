/**
 * Verificador de Eventos do Windows para Impressão
 * Responsabilidade: Verificar eventos de erro do sistema relacionados à impressão
 */

const { executarComando } = require('../../utils/exec-utils');

/**
 * Verifica eventos recentes do sistema relacionados à impressora
 * @param {string} nomeImpressora - Nome da impressora
 * @param {number} ultimosMinutos - Últimos N minutos para verificar
 * @returns {Promise<Array<object>>} - Eventos encontrados
 */
async function verificarEventosImpressora(nomeImpressora, ultimosMinutos = 2) {
  try {
    const nomeEscapado = nomeImpressora.replace(/'/g, "''");
    
    // PowerShell para verificar eventos recentes do sistema relacionados a impressão
    const comando = `powershell -Command "$events = Get-WinEvent -LogName System -MaxEvents 50 -ErrorAction SilentlyContinue | Where-Object { $_.TimeCreated -gt (Get-Date).AddMinutes(-${ultimosMinutos}) -and ($_.Message -like '*${nomeEscapado}*' -or $_.Message -like '*Print*' -or $_.Message -like '*Spooler*') }; if ($events) { $events | ForEach-Object { Write-Output ('ID:' + $_.Id + '|TIME:' + $_.TimeCreated.ToString('HH:mm:ss') + '|LEVEL:' + $_.LevelDisplayName + '|MSG:' + ($_.Message -replace '[\\r\\n]', ' ').Substring(0, [Math]::Min(200, $_.Message.Length))) } } else { Write-Output 'VAZIO' }"`;
    
    const { stdout } = await executarComando(comando, { timeout: 10000 });
    
    if (!stdout || stdout.includes('VAZIO') || stdout.trim().length === 0) {
      return [];
    }
    
    const linhas = stdout.split('\n').filter(l => l.trim());
    const eventos = linhas.map(linha => {
      const partes = linha.split('|');
      const evento = {};
      partes.forEach(parte => {
        if (parte.startsWith('ID:')) evento.id = parseInt(parte.substring(3));
        if (parte.startsWith('TIME:')) evento.hora = parte.substring(5);
        if (parte.startsWith('LEVEL:')) evento.nivel = parte.substring(6);
        if (parte.startsWith('MSG:')) evento.mensagem = parte.substring(4);
      });
      return evento;
    });
    
    return eventos;
  } catch (error) {
    console.warn(`⚠️ Erro ao verificar eventos: ${error.message}`);
    return [];
  }
}

/**
 * Verifica se há erros de impressão recentes
 * @param {string} nomeImpressora - Nome da impressora
 * @returns {Promise<Array<string>>} - Mensagens de erro encontradas
 */
async function verificarErrosImpressao(nomeImpressora) {
  const eventos = await verificarEventosImpressora(nomeImpressora, 2);
  
  const erros = eventos
    .filter(e => e.nivel && (e.nivel.includes('Error') || e.nivel.includes('Warning')))
    .map(e => `[${e.hora}] ${e.mensagem}`)
    .slice(0, 5); // Apenas últimos 5 erros
  
  return erros;
}

module.exports = {
  verificarEventosImpressora,
  verificarErrosImpressao
};

