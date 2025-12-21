/**
 * Comandos ESC/POS
 * Responsabilidade: Gerar comandos ESC/POS para controle da impressora
 */

const ESC = 0x1B;
const GS = 0x1D;
const LF = 0x0A;

/**
 * Comandos de inicialização
 */
function inicializar() {
  return Buffer.from([ESC, 0x40]); // ESC @ - Reset
}

/**
 * Define Code Page 850 (Multilingual)
 * Necessário para acentos corretos no Brasil
 */
function setCodePage850() {
  return Buffer.from([ESC, 0x74, 0x02]); // ESC t 2
}

/**
 * Comandos de finalização
 */
function cortarPapel() {
  return Buffer.from([GS, 0x56, 66, 0]); // GS V 66 0 - Corte completo
}

function linhaEmBranco(quantidade) {
  return Buffer.alloc(quantidade, LF); // LF repetido
}

/**
 * Limpa o buffer da impressora (força processamento de comandos pendentes)
 * IMPORTANTE: Crítico para impressoras autenticadoras Diebold
 * Deve ser usado ANTES do corte de papel
 */
function limparBuffer() {
  return Buffer.from([ESC, 0x69]); // ESC i - Flush buffer
}

/**
 * Adiciona comandos de inicialização ao início dos dados
 */
function adicionarInicializacao(dados) {
  const init = inicializar();
  return Buffer.concat([init, dados]);
}

/**
 * Adiciona comandos de finalização ao final dos dados
 * @param {Buffer} dados - Dados do cupom
 * @param {string} tipoImpressora - Tipo da impressora
 * @returns {Buffer} - Dados com comandos de finalização
 * 
 * SEQUÊNCIA CORRETA PARA IMPRESSORAS AUTENTICADORAS:
 * 1. Conteúdo do cupom
 * 2. 3 linhas em branco (garante que conteúdo foi impresso)
 * 3. Limpar buffer (ESC i) - força processamento de comandos pendentes
 * 4. Corte de papel (GS V 66 0)
 * 5. Feed final (LF) - ajuda a liberar papel
 */
function adicionarFinalizacao(dados, tipoImpressora) {
  // 1. Linhas em branco antes do corte (garante que conteúdo foi impresso)
  const linhas = linhaEmBranco(3);

  // 2. Limpar buffer - CRÍTICO para impressoras autenticadoras Diebold
  const buffer = limparBuffer();

  // 3. Corte de papel
  const corte = cortarPapel();

  // 4. Feed final (ajuda impressoras autenticadoras a liberar papel)
  const feedFinal = linhaEmBranco(1);

  return Buffer.concat([dados, linhas, buffer, corte, feedFinal]);
}

module.exports = {
  inicializar,
  cortarPapel,
  linhaEmBranco,
  limparBuffer,
  setCodePage850, // NOVO
  adicionarInicializacao,
  adicionarFinalizacao
};

