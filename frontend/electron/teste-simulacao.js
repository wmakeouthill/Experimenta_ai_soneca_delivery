const { enviarParaSpooler } = require('./infrastructure/os/windows-spooler-printer');

async function teste() {
    console.log('🧪 TESTE SIMULAÇÃO APP');

    // Sequência exata que está falhando no app
    const dados = Buffer.concat([
        Buffer.from([0x1b, 0x40]), // Reset (Electron)
        Buffer.from([0x1b, 0x61, 0x01]), // Center (Backend)
        Buffer.from([0x1b, 0x21, 0x30]), // Mode (Backend)
        Buffer.from('Experimenta ai - soneca'), // Texto
        Buffer.from([0x0a, 0x0a]), // 2x LF (Electron)
        Buffer.from([0x1d, 0x56, 66, 0]) // Corte (Electron)
    ]);

    console.log(`📦 Enviando ${dados.length} bytes...`);
    try {
        const res = await enviarParaSpooler(dados, 'USB001', 'DIABO');
        console.log('✅ Resultado:', res);
    } catch (e) {
        console.error('❌ Erro:', e);
    }
}

teste();
