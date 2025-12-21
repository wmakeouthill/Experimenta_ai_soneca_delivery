const { enviarParaSpooler } = require('./infrastructure/os/windows-spooler-printer');

async function teste(nome, buffer) {
    console.log(`🧪 Testando: ${nome}`);
    try {
        const res = await enviarParaSpooler(buffer, 'USB001', 'DIABO');
        console.log(`✅ ${nome}: Enviado - ${res}`);
    } catch (e) {
        console.log(`❌ ${nome}: Falhou - ${e.message}`);
    }
}

async function run() {
    const caso = process.argv[2];

    if (!caso) {
        console.log("Uso: node teste-debug.js <numero>");
        console.log("1: Sem Mode (ESC !)");
        console.log("2: Sem Center (ESC a)");
        console.log("3: Com LF após Reset (igual teste simples)");
        return;
    }

    // 1. Sem Mode (ESC !)
    if (caso === '1') {
        const buffer = Buffer.concat([
            Buffer.from([0x1b, 0x40]), // Reset
            Buffer.from([0x1b, 0x61, 0x01]), // Center
            Buffer.from('TESTE SEM MODE'),
            Buffer.from([0x0a, 0x0a]),
            Buffer.from([0x1d, 0x56, 66, 0])
        ]);
        await teste("Sem Mode", buffer);
    }

    // 2. Sem Center (ESC a)
    if (caso === '2') {
        const buffer = Buffer.concat([
            Buffer.from([0x1b, 0x40]), // Reset
            Buffer.from([0x1b, 0x21, 0x30]), // Mode
            Buffer.from('TESTE SEM CENTER'),
            Buffer.from([0x0a, 0x0a]),
            Buffer.from([0x1d, 0x56, 66, 0])
        ]);
        await teste("Sem Center", buffer);
    }

    // 3. Com LF após Reset (igual teste simples)
    if (caso === '3') {
        const buffer = Buffer.concat([
            Buffer.from([0x1b, 0x40]), // Reset
            Buffer.from([0x0a]), // LF EXTRA
            Buffer.from([0x1b, 0x61, 0x01]), // Center
            Buffer.from([0x1b, 0x21, 0x30]), // Mode
            Buffer.from('TESTE COM LF'),
            Buffer.from([0x0a, 0x0a]),
            Buffer.from([0x1d, 0x56, 66, 0])
        ]);
        await teste("Com LF", buffer);
    }
}

run();
