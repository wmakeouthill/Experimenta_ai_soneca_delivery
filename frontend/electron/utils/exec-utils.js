/**
 * Utilitário para execução de comandos do sistema
 * Wrapper para exec() com timeout e tratamento de erros
 */

const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);

/**
 * Executa um comando do sistema com timeout
 * @param {string} comando - Comando a executar
 * @param {object} opcoes - Opções (timeout, maxBuffer, etc.)
 * @returns {Promise<{stdout: string, stderr: string}>}
 */
async function executarComando(comando, opcoes = {}) {
  const opcoesPadrao = {
    timeout: 10000,
    maxBuffer: 1024 * 1024, // 1MB
    ...opcoes
  };

  return await execPromise(comando, opcoesPadrao);
}

module.exports = {
  executarComando,
  execPromise
};

