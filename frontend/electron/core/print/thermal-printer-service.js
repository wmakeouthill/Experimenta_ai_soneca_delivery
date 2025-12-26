/**
 * Thermal Printer Service
 * Responsabilidade: Impressão de cupons usando node-thermal-printer
 * 
 * Esta biblioteca lida corretamente com a conversão de imagens para ESC/POS,
 * garantindo compatibilidade com Epson, Star, Daruma, e impressoras genéricas.
 */

const { ThermalPrinter, PrinterTypes, CharacterSet } = require('node-thermal-printer');
const { processarBase64ParaArquivo, removerArquivoTemporario } = require('./image-processor');
const path = require('path');

/**
 * Mapa de tipos de impressora para o enum do node-thermal-printer
 * DEVE corresponder ao TipoImpressora.java no backend
 */
const TIPO_IMPRESSORA_MAP = {
    // Epson (padrão ESC/POS)
    'EPSON': PrinterTypes.EPSON,
    'EPSON_TM_T20': PrinterTypes.EPSON,
    'EPSON_TM_T88': PrinterTypes.EPSON,

    // Daruma
    'DARUMA': PrinterTypes.DARUMA,
    'DARUMA_800': PrinterTypes.DARUMA,
    'DARUMA_700': PrinterTypes.DARUMA,

    // Diebold Nixdorf (usa protocolo Epson)
    'DIEBOLD': PrinterTypes.EPSON,
    'DIEBOLD_IM693H': PrinterTypes.EPSON,

    // Star
    'STAR': PrinterTypes.STAR,
    'STAR_TSP': PrinterTypes.STAR,
    'STAR_TSP100': PrinterTypes.STAR,
    'STAR_TSP650': PrinterTypes.STAR,

    // Brother
    'BROTHER': PrinterTypes.BROTHER,

    // Tanca
    'TANCA': PrinterTypes.TANCA,

    // Bematech (usa protocolo Epson)
    'BEMATECH': PrinterTypes.EPSON,
    'BEMATECH_MP4200': PrinterTypes.EPSON,

    // Elgin (usa protocolo Epson)
    'ELGIN': PrinterTypes.EPSON,
    'ELGIN_I9': PrinterTypes.EPSON,
    'ELGIN_I7': PrinterTypes.EPSON,

    // Genéricas (chinesas/POS-58/POS-80)
    'POS_58': PrinterTypes.EPSON,
    'POS_80': PrinterTypes.EPSON,
    'GENERICA': PrinterTypes.EPSON,
    'GENERICA_ESCPOS': PrinterTypes.EPSON
};

/**
 * Obtém o tipo de impressora para o node-thermal-printer
 * @param {string} tipoImpressora - Tipo da impressora (EPSON, STAR, DARUMA, etc.)
 * @returns {string} - Tipo formatado para node-thermal-printer
 */
function obterTipoImpressora(tipoImpressora) {
    if (!tipoImpressora) {
        return PrinterTypes.EPSON; // Padrão
    }

    const tipoUpper = tipoImpressora.toUpperCase();
    return TIPO_IMPRESSORA_MAP[tipoUpper] || PrinterTypes.EPSON;
}

/**
 * Converte devicePath para formato de interface do node-thermal-printer
 * @param {string} devicePath - Caminho do dispositivo (COM3, USB001, tcp://ip:port, etc.)
 * @param {string} [nomeImpressora] - Nome da impressora no sistema
 * @returns {string} - Interface formatada
 */
function formatarInterface(devicePath, nomeImpressora) {
    if (!devicePath && !nomeImpressora) {
        throw new Error('devicePath ou nomeImpressora é obrigatório');
    }

    // Se for endereço de rede, retorna diretamente
    if (devicePath && devicePath.startsWith('tcp://')) {
        return devicePath;
    }

    // Se tiver nome da impressora, usa o driver do sistema
    if (nomeImpressora) {
        return `printer:${nomeImpressora}`;
    }

    // Porta COM no Windows
    if (devicePath && devicePath.toUpperCase().startsWith('COM')) {
        return `\\\\.\\${devicePath.toUpperCase()}`;
    }

    // USB no Windows (usar nome da impressora)
    if (devicePath && devicePath.toUpperCase().startsWith('USB')) {
        // USB001, USB002, etc. precisam do nome da impressora
        console.warn(`⚠️ devicePath USB detectado (${devicePath}), tentando usar como impressora do sistema`);
        return `printer:auto`;
    }

    // Linux/Mac - caminho direto
    if (devicePath && devicePath.startsWith('/')) {
        return devicePath;
    }

    // Fallback: tenta usar como nome de impressora
    return `printer:${devicePath}`;
}

/**
 * Cria uma instância configurada do ThermalPrinter
 * @param {string} devicePath - Caminho/porta do dispositivo
 * @param {string} tipoImpressora - Tipo da impressora
 * @param {string} [nomeImpressora] - Nome da impressora no sistema
 * @returns {ThermalPrinter}
 */
function criarInstanciaPrinter(devicePath, tipoImpressora, nomeImpressora) {
    const interfaceFormatada = formatarInterface(devicePath, nomeImpressora);
    const tipo = obterTipoImpressora(tipoImpressora);

    console.log(`🖨️ Criando instância de impressora:`);
    console.log(`   Tipo: ${tipoImpressora} → ${tipo}`);
    console.log(`   Interface: ${interfaceFormatada}`);

    return new ThermalPrinter({
        type: tipo,
        interface: interfaceFormatada,
        characterSet: CharacterSet.PC850_LATIN1,
        width: 48,
        removeSpecialCharacters: false,
        lineCharacter: '-',
        options: {
            timeout: 5000
        }
    });
}

/**
 * Imprime um cupom fiscal completo usando node-thermal-printer
 * @param {Object} dados - Dados do cupom
 * @param {string} dados.logoBase64 - Logo em base64 (opcional)
 * @param {string} dados.conteudoTexto - Conteúdo texto do cupom (formatado)
 * @param {Buffer} dados.conteudoBuffer - Conteúdo ESC/POS binário do backend
 * @param {string} devicePath - Caminho do dispositivo
 * @param {string} tipoImpressora - Tipo da impressora
 * @param {string} [nomeImpressora] - Nome da impressora
 * @returns {Promise<{sucesso: boolean, erro?: string}>}
 */
async function imprimirCupom(dados, devicePath, tipoImpressora, nomeImpressora) {
    let logoPath = null;

    try {
        const printer = criarInstanciaPrinter(devicePath, tipoImpressora, nomeImpressora);

        // Verifica conexão
        const conectada = await printer.isPrinterConnected();
        console.log(`📡 Status da conexão: ${conectada ? 'Conectada' : 'Falha na conexão'}`);

        // 1. Imprime logo se existir
        if (dados.logoBase64 && dados.logoBase64.length > 0) {
            console.log('🖼️ Processando logo para impressão...');
            const resultado = await processarBase64ParaArquivo(dados.logoBase64);

            if (resultado.success) {
                logoPath = resultado.filePath;
                printer.alignCenter();
                await printer.printImage(logoPath);
                printer.newLine();
            } else {
                console.warn(`⚠️ Não foi possível processar o logo: ${resultado.error}`);
            }
        }

        // 2. Se tiver conteúdo binário do backend, usa raw
        if (dados.conteudoBuffer && dados.conteudoBuffer.length > 0) {
            console.log(`📄 Enviando conteúdo ESC/POS: ${dados.conteudoBuffer.length} bytes`);
            await printer.raw(dados.conteudoBuffer);
        }

        // 3. Corta o papel
        printer.cut();

        // 4. Executa impressão
        console.log('🖨️ Executando impressão...');
        await printer.execute();

        console.log('✅ Impressão concluída com sucesso');
        return { sucesso: true };

    } catch (error) {
        console.error('❌ Erro na impressão:', error);
        return { sucesso: false, erro: error.message };
    } finally {
        // Limpa arquivo temporário do logo
        if (logoPath) {
            removerArquivoTemporario(logoPath);
        }
    }
}

/**
 * Testa conexão com a impressora
 * @param {string} devicePath - Caminho do dispositivo
 * @param {string} tipoImpressora - Tipo da impressora
 * @param {string} [nomeImpressora] - Nome da impressora
 * @returns {Promise<{sucesso: boolean, conectada: boolean, erro?: string}>}
 */
async function testarConexao(devicePath, tipoImpressora, nomeImpressora) {
    try {
        const printer = criarInstanciaPrinter(devicePath, tipoImpressora, nomeImpressora);
        const conectada = await printer.isPrinterConnected();
        return { sucesso: true, conectada };
    } catch (error) {
        return { sucesso: false, conectada: false, erro: error.message };
    }
}

/**
 * Imprime uma página de teste
 * @param {string} devicePath - Caminho do dispositivo
 * @param {string} tipoImpressora - Tipo da impressora
 * @param {string} [nomeImpressora] - Nome da impressora
 * @param {string} [logoBase64] - Logo opcional para testar
 * @returns {Promise<{sucesso: boolean, erro?: string}>}
 */
async function imprimirTeste(devicePath, tipoImpressora, nomeImpressora, logoBase64) {
    let logoPath = null;

    try {
        const printer = criarInstanciaPrinter(devicePath, tipoImpressora, nomeImpressora);

        // Logo
        if (logoBase64 && logoBase64.length > 0) {
            const resultado = await processarBase64ParaArquivo(logoBase64);
            if (resultado.success) {
                logoPath = resultado.filePath;
                printer.alignCenter();
                await printer.printImage(logoPath);
                printer.newLine();
            }
        }

        // Cabeçalho
        printer.alignCenter();
        printer.setTextDoubleHeight();
        printer.bold(true);
        printer.println('TESTE DE IMPRESSAO');
        printer.bold(false);
        printer.setTextNormal();
        printer.newLine();

        // Informações
        printer.alignLeft();
        printer.drawLine();
        printer.println(`Data: ${new Date().toLocaleString('pt-BR')}`);
        printer.println(`Impressora: ${nomeImpressora || devicePath}`);
        printer.println(`Tipo: ${tipoImpressora || 'NAO DEFINIDO'}`);
        printer.drawLine();

        // Teste de caracteres
        printer.println('Caracteres especiais:');
        printer.println('aeiou AEIOU');
        printer.println('cC Aã Oõ');
        printer.drawLine();

        // Rodapé
        printer.alignCenter();
        printer.println('Teste concluido com sucesso!');
        printer.newLine();

        printer.cut();
        await printer.execute();

        console.log('✅ Teste de impressão concluído');
        return { sucesso: true };

    } catch (error) {
        console.error('❌ Erro no teste de impressão:', error);
        return { sucesso: false, erro: error.message };
    } finally {
        if (logoPath) {
            removerArquivoTemporario(logoPath);
        }
    }
}

module.exports = {
    imprimirCupom,
    testarConexao,
    imprimirTeste,
    criarInstanciaPrinter,
    obterTipoImpressora
};
