/**
 * Impressora Windows - Rede
 * Responsabilidade: Enviar dados para impressora de rede (IP:PORTA)
 */

const net = require('net');

/**
 * Envia dados para impressora de rede via socket TCP
 * @param {Buffer} dados - Dados ESC/POS binários
 * @param {string} enderecoRede - Endereço IP:PORTA (ex: 192.168.1.100:9100)
 * @returns {Promise<{sucesso: boolean, erro?: string}>}
 */
async function enviarParaRede(dados, enderecoRede) {
  console.log(`🌐 Enviando para impressora de rede: ${enderecoRede}`);
  
  const [ip, porta] = enderecoRede.split(':');

  return new Promise((resolve) => {
    const socket = new net.Socket();
    
    socket.connect(parseInt(porta), ip, () => {
      console.log(`✅ Conectado em ${ip}:${porta}`);
      socket.write(dados);
      socket.end();
      resolve({ sucesso: true });
    });

    socket.on('error', (error) => {
      console.error(`❌ Erro de socket:`, error.message);
      resolve({ sucesso: false, erro: error.message });
    });

    socket.setTimeout(5000, () => {
      console.error(`❌ Timeout ao conectar em ${ip}:${porta}`);
      socket.destroy();
      resolve({ sucesso: false, erro: 'Timeout ao conectar na impressora' });
    });
  });
}

module.exports = {
  enviarParaRede
};

