#!/usr/bin/env node
/**
 * Script para sincronizar arquivos do frontend (dist) para o backend (target/classes/static)
 * em tempo real durante o desenvolvimento.
 *
 * Este script observa mudanças em frontend/dist/frontend/browser e copia para
 * sistema-orquestrador/target/classes/static para que o Spring Boot sirva as mudanças.
 *
 * Uso:
 *   node scripts/sync-to-backend.js
 *
 * Requisitos:
 *   - npm install --save-dev chokidar-cli (ou usar chokidar diretamente)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Caminhos
const FRONTEND_DIST = path.resolve(__dirname, '../dist/frontend/browser');
const BACKEND_STATIC = path.resolve(__dirname, '../../sistema-orquestrador/target/classes/static');

console.log('🔄 Sincronizador Frontend → Backend');
console.log(`📂 Origem: ${FRONTEND_DIST}`);
console.log(`📂 Destino: ${BACKEND_STATIC}`);

// Criar diretório de destino se não existir
if (!fs.existsSync(BACKEND_STATIC)) {
    console.log(`📁 Criando diretório: ${BACKEND_STATIC}`);
    fs.mkdirSync(BACKEND_STATIC, { recursive: true });
}

// Função para copiar arquivo/diretório
function copiarRecursivo(origem, destino) {
    const stat = fs.statSync(origem);

    if (stat.isDirectory()) {
        // Criar diretório se não existir
        if (!fs.existsSync(destino)) {
            fs.mkdirSync(destino, { recursive: true });
        }

        // Copiar conteúdo do diretório
        const arquivos = fs.readdirSync(origem);
        arquivos.forEach(arquivo => {
            copiarRecursivo(
                path.join(origem, arquivo),
                path.join(destino, arquivo)
            );
        });
    } else {
        // Copiar arquivo
        fs.copyFileSync(origem, destino);
    }
}

// Função para sincronizar tudo
function sincronizarTudo() {
    if (!fs.existsSync(FRONTEND_DIST)) {
        console.log(`⏳ Aguardando build do frontend em: ${FRONTEND_DIST}`);
        return;
    }

    console.log('🔄 Sincronizando arquivos...');

    try {
        // Limpar destino antes de copiar (exceto se for a primeira vez)
        if (fs.existsSync(BACKEND_STATIC)) {
            const arquivos = fs.readdirSync(BACKEND_STATIC);
            arquivos.forEach(arquivo => {
                const caminhoCompleto = path.join(BACKEND_STATIC, arquivo);
                const stat = fs.statSync(caminhoCompleto);
                if (stat.isDirectory()) {
                    fs.rmSync(caminhoCompleto, { recursive: true, force: true });
                } else {
                    fs.unlinkSync(caminhoCompleto);
                }
            });
        }

        // Copiar tudo
        copiarRecursivo(FRONTEND_DIST, BACKEND_STATIC);
        console.log('✅ Sincronização concluída!');
    } catch (erro) {
        console.error('❌ Erro ao sincronizar:', erro.message);
    }
}

// Verificar se chokidar está disponível
let chokidar;
try {
    chokidar = require('chokidar');
} catch (e) {
    console.error('❌ chokidar não encontrado. Instale com: npm install --save-dev chokidar');
    console.log('💡 Executando sincronização única...');
    sincronizarTudo();
    process.exit(0);
}

// Sincronização inicial
sincronizarTudo();

// Observar mudanças
console.log('👀 Observando mudanças em:', FRONTEND_DIST);

const watcher = chokidar.watch(FRONTEND_DIST, {
    ignored: /(^|[\/\\])\../, // Ignorar arquivos ocultos
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
        stabilityThreshold: 500, // Aguardar 500ms após última mudança
        pollInterval: 100
    }
});

watcher
    .on('add', (caminho) => {
        console.log(`➕ Arquivo adicionado: ${path.relative(FRONTEND_DIST, caminho)}`);
        sincronizarTudo();
    })
    .on('change', (caminho) => {
        console.log(`🔄 Arquivo alterado: ${path.relative(FRONTEND_DIST, caminho)}`);
        sincronizarTudo();
    })
    .on('unlink', (caminho) => {
        console.log(`🗑️  Arquivo removido: ${path.relative(FRONTEND_DIST, caminho)}`);
        sincronizarTudo();
    })
    .on('error', (erro) => {
        console.error('❌ Erro no watcher:', erro);
    })
    .on('ready', () => {
        console.log('✅ Watcher pronto! Mudanças serão sincronizadas automaticamente.');
    });

// Tratamento de sinais para encerrar graciosamente
process.on('SIGINT', () => {
    console.log('\n🛑 Encerrando sincronizador...');
    watcher.close();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Encerrando sincronizador...');
    watcher.close();
    process.exit(0);
});

