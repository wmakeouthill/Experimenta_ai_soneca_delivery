/**
 * Image Processor
 * Responsabilidade: Processar imagens base64 para impressão térmica ESC/POS
 * 
 * Fornece duas opções:
 * 1. processarBase64ParaArquivo - Salva PNG para uso com node-thermal-printer
 * 2. processarBase64ParaBuffer - Converte diretamente para comandos ESC/POS (GS v 0)
 */

const path = require('path');
const fs = require('fs');
const os = require('os');

// Importação dinâmica do Jimp para garantir compatibilidade com v1.x
let JimpLib;
try {
    // Jimp v1.x usa exportação nomeada: { Jimp }
    const jimpModule = require('jimp');
    if (jimpModule.Jimp) {
        JimpLib = jimpModule.Jimp;
        console.log('✅ Jimp v1.x carregado (named export)');
    } else if (typeof jimpModule.read === 'function') {
        // Fallback para versões anteriores
        JimpLib = jimpModule;
        console.log('✅ Jimp legacy carregado (default export)');
    } else if (jimpModule.default?.read) {
        JimpLib = jimpModule.default;
        console.log('✅ Jimp carregado (default property)');
    } else {
        throw new Error('Formato de Jimp não reconhecido');
    }
} catch (error) {
    console.error('❌ Erro ao carregar Jimp:', error);
    throw new Error('Jimp não está instalado corretamente. Execute: npm install jimp');
}

// Diretório temporário para imagens processadas
const TEMP_DIR = path.join(os.tmpdir(), 'experimenta-ai-print');

// Garante que o diretório temporário existe
if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
}

/**
 * Converte uma imagem base64 diretamente para comandos ESC/POS (GS v 0)
 * Este método é mais compatível que usar node-thermal-printer para imagens
 * @param {string} base64Data - Imagem em formato base64 (com ou sem prefixo data:image)
 * @param {number} [maxWidth=384] - Largura máxima em pixels (padrão 48mm = 384px a 203 DPI)
 * @returns {Promise<{success: boolean, buffer?: Buffer, error?: string}>}
 */
async function processarBase64ParaBuffer(base64Data, maxWidth = 384) {
    try {
        if (!base64Data || typeof base64Data !== 'string') {
            return { success: false, error: 'base64Data é obrigatório' };
        }

        // Remove prefixo data:image se existir
        let base64Clean = base64Data;
        if (base64Clean.includes(',')) {
            base64Clean = base64Clean.substring(base64Clean.indexOf(',') + 1);
        }

        // Decodifica base64 para buffer
        const imageBuffer = Buffer.from(base64Clean, 'base64');

        // Carrega imagem com Jimp
        const image = await JimpLib.read(imageBuffer);

        // Redimensiona se necessário (mantendo proporção)
        const currentWidth = image.width || image.getWidth?.() || 384;
        if (currentWidth > maxWidth) {
            // Jimp v1.x usa { w } em vez de (width, AUTO)
            image.resize({ w: maxWidth });
        }

        // Converte para escala de cinza e aumenta contraste
        image.grayscale().contrast(0.2);

        const width = image.width || image.getWidth?.() || 0;
        const height = image.height || image.getHeight?.() || 0;

        // Largura em bytes (8 pixels por byte)
        const widthBytes = Math.ceil(width / 8);

        // Buffer para dados do bitmap
        const bitmapData = [];

        // Converte cada pixel para bit (1 = preto, 0 = branco)
        for (let y = 0; y < height; y++) {
            for (let xByte = 0; xByte < widthBytes; xByte++) {
                let byte = 0;
                for (let bit = 0; bit < 8; bit++) {
                    const x = xByte * 8 + bit;
                    if (x < width) {
                        const idx = (y * width + x) * 4; // RGBA
                        const pixelBuffer = image.bitmap.data;
                        const gray = pixelBuffer[idx]; // Já está em escala de cinza
                        // Threshold: pixels escuros (< 128) viram preto (1)
                        if (gray < 128) {
                            byte |= (1 << (7 - bit));
                        }
                    }
                }
                bitmapData.push(byte);
            }
        }

        // Monta comando ESC/POS GS v 0 (raster bit image)
        // Formato: GS v 0 m xL xH yL yH [dados]
        // m = 0 (modo normal, 1 dot por pixel)
        const nL = widthBytes & 0xFF;
        const nH = (widthBytes >> 8) & 0xFF;
        const vL = height & 0xFF;
        const vH = (height >> 8) & 0xFF;

        // Constrói buffer completo
        const header = Buffer.from([
            0x1B, 0x61, 0x01,  // ESC a 1 - Centralizar
            0x1D, 0x76, 0x30, 0x00,  // GS v 0 m=0 (normal density)
            nL, nH,  // Largura em bytes
            vL, vH   // Altura em pixels
        ]);

        const imageData = Buffer.from(bitmapData);
        const footer = Buffer.from([0x0A, 0x0A]);  // 2 line feeds após imagem

        const result = Buffer.concat([header, imageData, footer]);

        console.log(`✅ Logo convertido para ESC/POS: ${width}x${height}px → ${result.length} bytes`);

        return { success: true, buffer: result };
    } catch (error) {
        console.error('❌ Erro ao converter logo para ESC/POS:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Converte uma imagem base64 para arquivo temporário PNG otimizado para impressão térmica
 * @param {string} base64Data - Imagem em formato base64 (com ou sem prefixo data:image)
 * @param {string} [filename] - Nome opcional do arquivo (sem extensão)
 * @param {number} [maxWidth=384] - Largura máxima em pixels (padrão 48mm = 384px a 203 DPI)
 * @returns {Promise<{success: boolean, filePath?: string, error?: string}>}
 */
async function processarBase64ParaArquivo(base64Data, filename = 'logo', maxWidth = 384) {
    try {
        if (!base64Data || typeof base64Data !== 'string') {
            return { success: false, error: 'base64Data é obrigatório' };
        }

        // Remove prefixo data:image se existir
        let base64Clean = base64Data;
        if (base64Clean.includes(',')) {
            base64Clean = base64Clean.substring(base64Clean.indexOf(',') + 1);
        }

        // Decodifica base64 para buffer
        const imageBuffer = Buffer.from(base64Clean, 'base64');

        // Carrega imagem com Jimp
        let image = await JimpLib.read(imageBuffer);

        // Redimensiona se necessário (mantendo proporção)
        let currentWidth = image.width || 384;
        if (currentWidth > maxWidth) {
            // Jimp v1.x usa { w } em vez de (width, AUTO)
            image.resize({ w: maxWidth });
            currentWidth = image.width;
        }

        // === CENTRALIZAÇÃO DINÂMICA ===
        // Calcula padding para centralizar a imagem no papel
        const paperWidth = maxWidth; // 384px para 48mm
        const imgWidth = image.width || currentWidth;
        const imgHeight = image.height || 100;

        if (imgWidth < paperWidth) {
            const leftPadding = Math.floor((paperWidth - imgWidth) / 2);

            if (leftPadding > 5) { // Só adiciona padding se for significativo
                // Cria canvas branco com a largura do papel
                const { Jimp } = require('jimp');
                const centered = new Jimp({ width: paperWidth, height: imgHeight, color: 0xFFFFFFFF });

                // Posiciona a imagem no centro
                centered.composite(image, leftPadding, 0);
                image = centered;

                console.log(`🎯 Imagem centralizada dinamicamente: padding=${leftPadding}px, largura final=${paperWidth}px`);
            }
        }

        // Salva como PNG temporário
        const filePath = path.join(TEMP_DIR, `${filename}_${Date.now()}.png`);

        // Jimp v1.x usa write() em vez de writeAsync()
        if (typeof image.write === 'function') {
            await image.write(filePath);
        } else {
            await image.writeAsync(filePath);
        }

        const finalWidth = image.width || image.getWidth?.() || 0;
        const finalHeight = image.height || image.getHeight?.() || 0;
        console.log(`✅ Imagem processada: ${filePath} (${finalWidth}x${finalHeight}px)`);

        return { success: true, filePath };
    } catch (error) {
        console.error('❌ Erro ao processar imagem:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Limpa arquivos temporários antigos (mais de 1 hora)
 */
function limparArquivosTemporarios() {
    try {
        if (!fs.existsSync(TEMP_DIR)) return;

        const agora = Date.now();
        const umaHora = 60 * 60 * 1000;

        const arquivos = fs.readdirSync(TEMP_DIR);
        for (const arquivo of arquivos) {
            const caminho = path.join(TEMP_DIR, arquivo);
            const stats = fs.statSync(caminho);

            if (agora - stats.mtimeMs > umaHora) {
                fs.unlinkSync(caminho);
                console.log(`🗑️ Arquivo temporário removido: ${arquivo}`);
            }
        }
    } catch (error) {
        console.error('❌ Erro ao limpar arquivos temporários:', error);
    }
}

/**
 * Remove um arquivo temporário específico
 * @param {string} filePath - Caminho do arquivo a ser removido
 */
function removerArquivoTemporario(filePath) {
    try {
        if (filePath && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    } catch (error) {
        console.error('❌ Erro ao remover arquivo temporário:', error);
    }
}

module.exports = {
    processarBase64ParaBuffer,
    processarBase64ParaArquivo,
    limparArquivosTemporarios,
    removerArquivoTemporario,
    TEMP_DIR
};

