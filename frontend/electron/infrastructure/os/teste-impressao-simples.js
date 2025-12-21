/**
 * Teste de Impressão Simples
 * Envia dados ESC/POS básicos para verificar se a impressora funciona
 */

const { enviarParaSpooler } = require('./windows-spooler-printer');

/**
 * Testa impressão com dados ESC/POS básicos
 * @param {string} nomeImpressora - Nome da impressora (já resolvido pelo Windows)
 * @param {string} devicePath - DevicePath da impressora (opcional, para logs)
 */
async function testarImpressaoSimples(nomeImpressora, devicePath = null) {
  console.log(`🧪 TESTE: Enviando dados ESC/POS básicos para "${nomeImpressora}"${devicePath ? ` (devicePath: ${devicePath})` : ''}`);
  
  // Dados ESC/POS básicos e simples:
  // 1. Reset (ESC @) - apenas uma vez
  // 2. Texto "TESTE"
  // 3. Linha em branco
  // 4. Corte de papel
  
  const dadosTeste = Buffer.from([
    0x1B, 0x40,        // ESC @ - Reset (apenas uma vez!)
    0x0A,              // LF - linha em branco
    0x54, 0x45, 0x53, 0x54, 0x45, 0x0A,  // "TESTE\n"
    0x0A,              // LF
    0x0A,              // LF
    0x1D, 0x56, 66, 0  // GS V 66 0 - Corte completo
  ]);
  
  console.log(`📦 Dados de teste: ${dadosTeste.length} bytes`);
  console.log(`🔍 Hex completo: ${dadosTeste.toString('hex')}`);
  console.log(`🔍 Texto: "${dadosTeste.toString('ascii', 3, 8)}"`);
  
  try {
    // Usa o devicePath fornecido ou tenta descobrir baseado no nome
    const devicePathParaUsar = devicePath || 'USB001';
    
    console.log(`📡 Enviando via spooler para "${nomeImpressora}" (devicePath: ${devicePathParaUsar})`);
    
    const resultado = await enviarParaSpooler(dadosTeste, devicePathParaUsar, nomeImpressora);
    console.log(`✅ Teste concluído:`, resultado);
    return {
      sucesso: true,
      nomeImpressora,
      devicePath: devicePathParaUsar
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
  testarImpressaoSimples
};

