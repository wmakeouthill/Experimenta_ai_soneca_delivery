/**
 * Monitor de Jobs do Spooler
 * Responsabilidade: Monitorar status de jobs de impressão no spooler do Windows
 */

const { executarComando } = require('../../utils/exec-utils');

/**
 * Verifica status de jobs na fila de impressão
 * @param {string} nomeImpressora - Nome da impressora
 * @param {number} timeoutMs - Timeout em milissegundos
 * @param {number} intervaloMs - Intervalo entre verificações em ms
 * @returns {Promise<object>} - Status dos jobs encontrados
 */
async function verificarJobsFila(nomeImpressora, timeoutMs = 5000, intervaloMs = 500) {
  const nomeEscapado = nomeImpressora.replace(/'/g, "''");
  
  try {
    const comando = `powershell -Command "$jobs = Get-PrintJob -PrinterName '${nomeEscapado}' -ErrorAction SilentlyContinue; if ($jobs) { $jobs | ForEach-Object { Write-Output ('ID:' + $_.Id + '|STATUS:' + $_.JobStatus + '|PAGES:' + $_.TotalPages + '|SIZE:' + $_.Size) } } else { Write-Output 'VAZIA' }"`;
    
    const { stdout } = await executarComando(comando, { timeout: timeoutMs });
    
    if (!stdout || stdout.includes('VAZIA') || stdout.trim().length === 0) {
      return { encontrados: 0, jobs: [] };
    }
    
    const linhas = stdout.split('\n').filter(l => l.trim());
    const jobs = linhas.map(linha => {
      const partes = linha.split('|');
      const job = {};
      partes.forEach(parte => {
        if (parte.startsWith('ID:')) job.id = parseInt(parte.substring(3));
        if (parte.startsWith('STATUS:')) job.status = parte.substring(7);
        if (parte.startsWith('PAGES:')) job.paginas = parseInt(parte.substring(6));
        if (parte.startsWith('SIZE:')) job.tamanho = parseInt(parte.substring(5));
      });
      return job;
    });
    
    return { encontrados: jobs.length, jobs };
  } catch (error) {
    console.warn(`⚠️ Erro ao verificar jobs: ${error.message}`);
    return { erro: error.message, encontrados: 0, jobs: [] };
  }
}

/**
 * Monitora job após envio, verificando se permanece na fila
 * @param {string} nomeImpressora - Nome da impressora
 * @param {number} timeoutTotalMs - Timeout total para monitoramento
 * @param {number} intervaloMs - Intervalo entre verificações
 * @returns {Promise<Array<object>>} - Histórico de verificações
 */
async function monitorarJobAposEnvio(nomeImpressora, timeoutTotalMs = 10000, intervaloMs = 500) {
  const historico = [];
  const inicio = Date.now();
  
  while ((Date.now() - inicio) < timeoutTotalMs) {
    const status = await verificarJobsFila(nomeImpressora, 2000);
    const timestamp = Date.now() - inicio;
    
    historico.push({
      timestamp: `${timestamp}ms`,
      ...status
    });
    
    // Se não há mais jobs, para de monitorar
    if (status.encontrados === 0) {
      break;
    }
    
    // Aguarda próximo intervalo
    await new Promise(resolve => setTimeout(resolve, intervaloMs));
  }
  
  return historico;
}

/**
 * Aguarda job ser processado (sair da fila)
 * @param {string} nomeImpressora - Nome da impressora
 * @param {number} timeoutMs - Timeout máximo
 * @returns {Promise<boolean>} - true se job foi processado, false se timeout
 */
async function aguardarJobProcessado(nomeImpressora, timeoutMs = 15000) {
  const inicio = Date.now();
  
  while ((Date.now() - inicio) < timeoutMs) {
    const status = await verificarJobsFila(nomeImpressora, 2000);
    
    if (status.encontrados === 0) {
      // Fila vazia - job foi processado ou removido
      return true;
    }
    
    // Verifica se algum job tem erro
    const jobComErro = status.jobs.find(j => 
      j.status && (
        j.status.includes('Error') || 
        j.status.includes('Failed') ||
        j.status.includes('Deleted')
      )
    );
    
    if (jobComErro) {
      console.warn(`⚠️ Job com erro detectado: ${jobComErro.status}`);
      return false;
    }
    
    // Aguarda próximo check
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return false; // Timeout
}

module.exports = {
  verificarJobsFila,
  monitorarJobAposEnvio,
  aguardarJobProcessado
};

