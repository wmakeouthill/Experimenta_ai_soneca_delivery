/**
 * Impressora Windows - Spooler
 * Responsabilidade: Enviar dados RAW para spooler do Windows via Win32 API
 *
 * Clean Architecture: Esta camada é Infrastructure (adaptador para Win32 API)
 *
 * OTIMIZAÇÕES:
 * - Dados enviados diretamente via base64 (sem arquivo temporário do cupom)
 * - Código C# mantido em memória (não salva arquivo a cada impressão)
 * - Validações melhoradas
 * - Tratamento de erros robusto
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const { executarComando } = require('../../utils/exec-utils');
const { criarArquivoTemporario, removerArquivoTemporarioComDelay } = require('../../utils/file-utils');
const { obterNomeImpressora, verificarImpressoraExiste } = require('./windows-spooler-helper');
const { CODIGO_CSHARP_RAW_PRINTER } = require('./windows-spooler-csharp');
// Removidas importações de debug/monitoramento para simplificar (como no teste simples)

// Cache do código C# - arquivo criado apenas 1 vez e reutilizado
const ARQUIVO_CSHARP_CACHE = path.join(os.tmpdir(), 'rawprinter_cache.cs');

/**
 * Garante que o código C# está disponível (arquivo cache)
 * @returns {string} - Caminho do arquivo C#
 */
function garantirCodigoCSharpDisponivel() {
  // Verifica se já existe arquivo cache
  if (fs.existsSync(ARQUIVO_CSHARP_CACHE)) {
    return ARQUIVO_CSHARP_CACHE;
  }

  // Cria arquivo cache (só na primeira vez)
  fs.writeFileSync(ARQUIVO_CSHARP_CACHE, CODIGO_CSHARP_RAW_PRINTER);
  return ARQUIVO_CSHARP_CACHE;
}

/**
 * Envia dados RAW para spooler do Windows via Win32 API
 *
 * FLUXO OTIMIZADO:
 * 1. Obtém nome real da impressora
 * 2. Valida impressora existe
 * 3. Converte dados para base64 (envio direto, sem arquivo)
 * 4. Compila código C# (usa cache se disponível)
 * 5. Envia dados via Win32 API
 * 6. Aguarda confirmação de sucesso
 *
 * @param {Buffer} dados - Dados ESC/POS binários já formatados
 * @param {string} devicePath - DevicePath de referência (ex: USB001)
 * @param {string|null} nomeImpressora - Nome real da impressora (opcional)
 * @returns {Promise<{sucesso: boolean}>}
 */
async function enviarParaSpooler(dados, devicePath, nomeImpressora = null) {
  // Validações iniciais
  if (!Buffer.isBuffer(dados)) {
    throw new Error('Dados devem ser um Buffer');
  }

  if (dados.length === 0) {
    throw new Error('Dados estão vazios');
  }

  // 1. Obtém nome real da impressora
  const nomeImpressoraReal = await obterNomeImpressora(devicePath, nomeImpressora);
  console.log(`📋 Preparando impressão para: "${nomeImpressoraReal}" (${dados.length} bytes)`);

  // 2. Verifica se impressora existe ANTES de processar dados
  if (!await verificarImpressoraExiste(nomeImpressoraReal)) {
    throw new Error(`Impressora '${nomeImpressoraReal}' não encontrada no sistema.`);
  }

  // NOTA: Removidas verificações extras de debug que podem estar causando delays
  // O teste simples funciona sem essas verificações, então vamos manter simples

  // 3. Cria arquivo temporário com dados do cupom
  // IMPORTANTE: Usa arquivo temporário porque dados podem ser muito grandes (com bitmap)
  // e excedem limite de linha de comando do PowerShell
  const arquivoCupom = criarArquivoTemporario(dados, 'cupom', '.prn');
  console.log(`💾 Arquivo temporário criado: ${arquivoCupom} (${dados.length} bytes)`);

  // 4. Prepara código C# (usa cache)
  const arquivoCSharp = garantirCodigoCSharpDisponivel();

  // 5. Constrói e executa comando PowerShell
  const comando = construirComandoPowerShell(
    nomeImpressoraReal,
    arquivoCupom,
    arquivoCSharp
  );

  try {
    // 6. Envia dados via Win32 API
    console.log(`🖨️ Enviando dados RAW via spooler do Windows...`);
    const { stdout, stderr } = await executarComando(comando, {
      timeout: 30000, // 30s para impressoras autenticadoras
      maxBuffer: 10 * 1024 * 1024 // 10MB para logs grandes
    });

    // 7. Valida resposta
    const resultadoCompleto = (stdout || '') + (stderr || '');

    if (resultadoCompleto.includes('SUCESSO')) {
      const mensagemSucesso = resultadoCompleto.trim();
      console.log(`✅ Dados enviados para spooler do Windows com sucesso`);
      console.log(`📊 Resposta: ${mensagemSucesso}`);

      // NOTA: Teste simples funciona sem verificar fila ou aguardar delays extras
      // Vamos manter simples e confiar no spooler do Windows
      // Se o job não aparecer, o problema é com o driver, não com nosso código

      return { sucesso: true };
    }

    // Erro detectado
    const erro = resultadoCompleto || 'Erro desconhecido';
    console.error(`❌ Erro na resposta do spooler: ${erro}`);
    throw new Error(erro);

  } catch (error) {
    const mensagemErro = error.message || 'Erro desconhecido';
    console.error(`❌ Erro ao imprimir: ${mensagemErro}`);

    // Log adicional para debugging
    if (error.code === 'ETIMEDOUT') {
      console.error(`⏱️ Timeout: O spooler pode estar processando (normal para impressoras autenticadoras)`);
    }

    throw new Error(`Falha ao imprimir: ${mensagemErro}`);
  } finally {
    // 6. Limpa arquivo temporário após delay (garante que spooler processou)
    // Delay de 10s para arquivo do cupom (pode ser grande e spooler precisa ler)
    removerArquivoTemporarioComDelay(arquivoCupom, 10000);
  }
}

/**
 * Constrói comando PowerShell para executar código C# e imprimir
 *
 * OTIMIZAÇÕES:
 * - Dados do cupom via arquivo temporário (evita limite de linha de comando)
 * - Código C# via arquivo cache (reutilizado, não criado toda vez)
 *
 * @param {string} nomeImpressora - Nome da impressora
 * @param {string} arquivoCupom - Caminho do arquivo temporário com dados do cupom
 * @param {string} arquivoCSharp - Caminho do arquivo C# cache
 * @returns {string} - Comando PowerShell completo
 */
function construirComandoPowerShell(nomeImpressora, arquivoCupom, arquivoCSharp) {
  // Escapa caracteres especiais para PowerShell
  const nomePSEscapado = nomeImpressora.replace(/'/g, "''").replace(/"/g, '`"');
  const arquivoCupomEscapado = arquivoCupom.replace(/\\/g, '\\\\').replace(/'/g, "''");
  const arquivoCSharpEscapado = arquivoCSharp.replace(/\\/g, '\\\\').replace(/'/g, "''");

  // Constrói comando completo
  // IMPORTANTE: Lê dados do arquivo temporário (evita limite de linha de comando)
  return `powershell -Command "$printerName = '${nomePSEscapado}'; $arquivoCupom = '${arquivoCupomEscapado}'; $csFile = '${arquivoCSharpEscapado}'; try { if (-not (Test-Path $arquivoCupom)) { Write-Error 'Arquivo do cupom não encontrado'; exit 1 }; $bytes = [System.IO.File]::ReadAllBytes($arquivoCupom); if ($bytes.Length -eq 0) { Write-Error 'Arquivo está vazio'; exit 1 }; $csCode = [System.IO.File]::ReadAllText($csFile); Add-Type -TypeDefinition $csCode; $resultado = [RawPrinter]::SendBytesToPrinter($printerName, $bytes); Write-Output $resultado; if (-not $resultado.StartsWith('SUCESSO')) { Write-Error $resultado; exit 1 } } catch { Write-Error ('Erro no PowerShell: ' + $_.Exception.Message); exit 1 }"`;
}


module.exports = {
  enviarParaSpooler
};
