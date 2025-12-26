/**
 * Image Processor
 * Responsabilidade: Processar imagens base64 para uso com node-thermal-printer
 * 
 * O node-thermal-printer requer um caminho de arquivo para imprimir imagens.
 * Este módulo converte base64 para arquivo temporário PNG.
 */

const Jimp = require('jimp');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Diretório temporário para imagens processadas
const TEMP_DIR = path.join(os.tmpdir(), 'experimenta-ai-print');

// Garante que o diretório temporário existe
if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
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
        const image = await Jimp.read(imageBuffer);

        // Redimensiona se necessário (mantendo proporção)
        if (image.getWidth() > maxWidth) {
            image.resize(maxWidth, Jimp.AUTO);
        }

        // Converte para escala de cinza e aumenta contraste (melhor para impressoras térmicas)
        image
            .grayscale()
            .contrast(0.2);

        // Salva como PNG temporário
        const filePath = path.join(TEMP_DIR, `${filename}_${Date.now()}.png`);
        await image.writeAsync(filePath);

        console.log(`✅ Imagem processada: ${filePath} (${image.getWidth()}x${image.getHeight()}px)`);

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
    processarBase64ParaArquivo,
    limparArquivosTemporarios,
    removerArquivoTemporario,
    TEMP_DIR
};
