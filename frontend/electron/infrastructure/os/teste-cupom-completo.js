/**
 * Teste de Impressão - Cupom Completo Simulado
 * Simula um cupom completo para identificar problemas
 */

const { enviarParaSpooler } = require('./windows-spooler-printer');
const { inicializar, cortarPapel, linhaEmBranco, limparBuffer } = require('../../core/print/escpos-commands');

/**
 * Testa impressão com cupom completo simulado (similar ao cupom real)
 * @param {string} nomeImpressora - Nome da impressora
 * @param {string} devicePath - DevicePath da impressora
 */
async function testarCupomCompleto(nomeImpressora, devicePath = null) {
  console.log(`🧪 TESTE CUPOM COMPLETO: Enviando para "${nomeImpressora}"${devicePath ? ` (devicePath: ${devicePath})` : ''}`);
  
  // Simula um cupom completo:
  // 1. Inicialização (reset)
  // 2. Conteúdo do cupom (texto formatado)
  // 3. Finalização (linhas, buffer flush, corte)
  
  const init = inicializar();
  const linhasFinal = linhaEmBranco(3);
  const bufferFlush = limparBuffer();
  const corte = cortarPapel();
  const feedFinal = linhaEmBranco(1);
  
  // Conteúdo simulado de um cupom (texto formatado)
  const conteudo = Buffer.concat([
    Buffer.from('EXPERIMENTA AI DO SONECA\n', 'utf8'),
    Buffer.from('Av. Leandro da Mota, 58\n', 'utf8'),
    Buffer.from('Duque de Caxias - RJ\n', 'utf8'),
    Buffer.from('Tel: (21) 97439-7966\n', 'utf8'),
    linhaEmBranco(1),
    Buffer.from('CNPJ: 12.345.678/0001-90\n', 'utf8'),
    Buffer.from('='.repeat(32) + '\n', 'utf8'),
    linhaEmBranco(1),
    Buffer.from('PEDIDO #12345\n', 'utf8'),
    Buffer.from('Data: 15/01/2025 14:30\n', 'utf8'),
    Buffer.from('='.repeat(32) + '\n', 'utf8'),
    linhaEmBranco(1),
    Buffer.from('1x X-Burger           R$ 15,00\n', 'utf8'),
    Buffer.from('2x Refrigerante       R$ 10,00\n', 'utf8'),
    Buffer.from('1x Batata Frita       R$  8,00\n', 'utf8'),
    Buffer.from('='.repeat(32) + '\n', 'utf8'),
    Buffer.from('TOTAL:                R$ 33,00\n', 'utf8'),
    linhaEmBranco(2),
    Buffer.from('Obrigado pela preferência!\n', 'utf8'),
  ]);
  
  // Monta cupom completo (como o sistema faz)
  const cupomCompleto = Buffer.concat([
    init,        // Reset
    conteudo,    // Conteúdo
    linhasFinal, // 3 linhas em branco
    bufferFlush, // ESC i - limpar buffer
    corte,       // GS V 66 0 - corte
    feedFinal    // Feed final
  ]);
  
  console.log(`📦 Cupom completo simulado: ${cupomCompleto.length} bytes`);
  console.log(`🔍 Primeiros 10 bytes (hex): ${cupomCompleto.slice(0, 10).toString('hex')}`);
  console.log(`🔍 Últimos 10 bytes (hex): ${cupomCompleto.slice(-10).toString('hex')}`);
  console.log(`   Deve terminar com: ESC i (1b69) + corte (1d564200) + LF (0a)`);
  
  try {
    const devicePathParaUsar = devicePath || 'USB001';
    
    console.log(`📡 Enviando cupom completo via spooler para "${nomeImpressora}" (devicePath: ${devicePathParaUsar})`);
    
    const resultado = await enviarParaSpooler(cupomCompleto, devicePathParaUsar, nomeImpressora);
    console.log(`✅ Teste concluído:`, resultado);
    return {
      sucesso: true,
      nomeImpressora,
      devicePath: devicePathParaUsar,
      tamanho: cupomCompleto.length
    };
  } catch (error) {
    console.error(`❌ Erro no teste:`, error.message);
    return {
      sucesso: false,
      erro: error.message
    };
  }
}

module.exports = {
  testarCupomCompleto
};

