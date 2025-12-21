/**
 * Script de Teste - Impressão Simples
 * Execute: node teste-imprimir-simples.js
 */

const http = require('http');

// Usa "DIABO" como nome da impressora (como está instalada no Windows)
const nomeImpressora = process.argv[2] || 'DIABO';
const devicePath = process.argv[3] || 'USB001';
const dados = JSON.stringify({
  devicePath: devicePath,
  nomeImpressora: nomeImpressora
});

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/teste/imprimir-simples',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(dados)
  }
};

console.log('🧪 TESTE: Enviando dados básicos ESC/POS...');
console.log(`📦 Impressora: "${nomeImpressora}"`);
console.log(`📦 DevicePath: "${devicePath}"`);

const req = http.request(options, (res) => {
  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    console.log(`📊 Resposta (${res.statusCode}):`, responseData);
    try {
      const json = JSON.parse(responseData);
      if (json.sucesso) {
        console.log('✅ Teste enviado com sucesso!');
      } else {
        console.log('❌ Teste falhou:', json.mensagem);
      }
    } catch (e) {
      console.log('📄 Resposta:', responseData);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Erro:', error.message);
});

req.write(dados);
req.end();

