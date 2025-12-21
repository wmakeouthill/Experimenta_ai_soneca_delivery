/**
 * Utilitário para operações de arquivo
 * Criação e remoção de arquivos temporários
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Cria um arquivo temporário com dados binários
 * @param {Buffer} dados - Dados para escrever (deve ser Buffer para garantir binário)
 * @param {string} prefixo - Prefixo do nome do arquivo (padrão: 'temp')
 * @param {string} extensao - Extensão do arquivo (padrão: '.tmp')
 * @returns {string} - Caminho do arquivo criado
 */
function criarArquivoTemporario(dados, prefixo = 'temp', extensao = '.tmp') {
  // Garante que dados é um Buffer (binário)
  if (!Buffer.isBuffer(dados)) {
    console.warn(`⚠️ Dados não são Buffer, convertendo para Buffer...`);
    dados = Buffer.from(dados);
  }
  
  const arquivoTemp = path.join(os.tmpdir(), `${prefixo}_${Date.now()}${extensao}`);
  
  // Escreve como binário (sem encoding = binário)
  fs.writeFileSync(arquivoTemp, dados, { encoding: null });
  
  // Verifica se foi escrito corretamente
  const stats = fs.statSync(arquivoTemp);
  if (stats.size !== dados.length) {
    console.error(`❌ Tamanho do arquivo não corresponde! Esperado: ${dados.length}, Obtido: ${stats.size}`);
  }
  
  return arquivoTemp;
}

/**
 * Remove um arquivo temporário
 * @param {string} caminhoArquivo - Caminho do arquivo a remover
 * @returns {boolean} - true se removido com sucesso, false caso contrário
 */
function removerArquivoTemporario(caminhoArquivo) {
  try {
    if (fs.existsSync(caminhoArquivo)) {
      fs.unlinkSync(caminhoArquivo);
      return true;
    }
    return false;
  } catch (error) {
    console.warn(`⚠️ Não foi possível remover arquivo temporário: ${caminhoArquivo}`, error.message);
    return false;
  }
}

/**
 * Remove um arquivo temporário após um delay
 * @param {string} caminhoArquivo - Caminho do arquivo a remover
 * @param {number} delayMs - Delay em milissegundos (padrão: 2000)
 */
function removerArquivoTemporarioComDelay(caminhoArquivo, delayMs = 2000) {
  setTimeout(() => {
    removerArquivoTemporario(caminhoArquivo);
  }, delayMs);
}

module.exports = {
  criarArquivoTemporario,
  removerArquivoTemporario,
  removerArquivoTemporarioComDelay
};

