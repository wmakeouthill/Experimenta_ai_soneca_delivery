const toIco = require('to-ico');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Tamanhos padrão para Windows 10 (em pixels)
// Esses tamanhos garantem que o ícone apareça corretamente em todos os contextos
const TAMANHOS_ICO = [16, 32, 48, 256];

// Pega os argumentos da linha de comando
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('Uso: node png-to-ico.js <arquivo-png> [arquivo-ico-saida]');
  console.log('Exemplo: node png-to-ico.js src/assets/experimenta_ai_banner_circular.png src/favicon.ico');
  console.log('\nO script criará um ICO com múltiplos tamanhos (16x16, 32x32, 48x48, 256x256)');
  console.log('para garantir exibição correta no Windows 10.');
  process.exit(1);
}

const inputFile = args[0];
const outputFile = args[1] || inputFile.replace(/\.png$/i, '.ico');

// Verifica se o arquivo de entrada existe
if (!fs.existsSync(inputFile)) {
  console.error(`❌ Erro: Arquivo não encontrado: ${inputFile}`);
  process.exit(1);
}

async function converterPngParaIco() {
  try {
    console.log(`📦 Lendo arquivo PNG: ${inputFile}`);
    
    // Lê a imagem original
    const imagemOriginal = sharp(inputFile);
    const metadata = await imagemOriginal.metadata();
    
    console.log(`📐 Dimensões originais: ${metadata.width}x${metadata.height}px`);
    console.log(`🔄 Redimensionando para múltiplos tamanhos...`);
    
    // Redimensiona para cada tamanho necessário
    const buffers = await Promise.all(
      TAMANHOS_ICO.map(async (tamanho) => {
        console.log(`  → Criando versão ${tamanho}x${tamanho}px`);
        return await imagemOriginal
          .resize(tamanho, tamanho, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 } // Fundo transparente
          })
          .png()
          .toBuffer();
      })
    );
    
    console.log(`🔨 Gerando arquivo ICO com ${TAMANHOS_ICO.length} tamanhos...`);
    
    // Converte para ICO com todos os tamanhos
    const icoBuffer = await toIco(buffers);
    
    // Cria o diretório de saída se não existir
    const outputDir = path.dirname(outputFile);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Salva o arquivo ICO
    fs.writeFileSync(outputFile, icoBuffer);
    
    const stats = fs.statSync(outputFile);
    const tamanhoKB = (stats.size / 1024).toFixed(2);
    
    console.log(`✅ Conversão concluída com sucesso!`);
    console.log(`📁 Arquivo salvo: ${outputFile}`);
    console.log(`📊 Tamanho: ${tamanhoKB} KB`);
    console.log(`📏 Tamanhos incluídos: ${TAMANHOS_ICO.join('x, ')}x pixels`);
    console.log(`\n💡 O ícone está pronto para uso no Electron no Windows 10!`);
  } catch (error) {
    console.error('❌ Erro ao converter PNG para ICO:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Executa a conversão
converterPngParaIco();

