/**
 * Envio Direto para Porta USB (Fallback)
 * Responsabilidade: Enviar dados diretamente para porta USB quando spooler falhar silenciosamente
 * 
 * IMPORTANTE: Usa CreateFile/WriteFile do Windows para escrever diretamente na porta USB,
 * bypassando o spooler apenas quando necessário (quando job não aparece na fila).
 */

const fs = require('fs');
const path = require('path');
const { executarComando } = require('../../utils/exec-utils');
const { criarArquivoTemporario, removerArquivoTemporarioComDelay } = require('../../utils/file-utils');

/**
 * Código C# para escrever diretamente na porta USB usando CreateFile/WriteFile
 */
const CODIGO_CSHARP_USB_DIRECT = `using System;
using System.IO;
using System.Runtime.InteropServices;

public class UsbDirectWriter {
  [DllImport("kernel32.dll", CharSet = CharSet.Auto, SetLastError = true)]
  public static extern IntPtr CreateFile(
    string lpFileName,
    uint dwDesiredAccess,
    uint dwShareMode,
    IntPtr lpSecurityAttributes,
    uint dwCreationDisposition,
    uint dwFlagsAndAttributes,
    IntPtr hTemplateFile
  );
  
  [DllImport("kernel32.dll", SetLastError = true)]
  public static extern bool WriteFile(
    IntPtr hFile,
    byte[] lpBuffer,
    uint nNumberOfBytesToWrite,
    out uint lpNumberOfBytesWritten,
    IntPtr lpOverlapped
  );
  
  [DllImport("kernel32.dll", SetLastError = true)]
  public static extern bool CloseHandle(IntPtr hObject);
  
  private const uint GENERIC_WRITE = 0x40000000;
  private const uint OPEN_EXISTING = 3;
  private const uint FILE_ATTRIBUTE_NORMAL = 0x80;
  
  public static string WriteToUsbPort(string portName, byte[] data) {
    IntPtr hFile = IntPtr.Zero;
    
    try {
      // Abre porta USB com permissão de escrita
      hFile = CreateFile(
        portName,
        GENERIC_WRITE,
        0,
        IntPtr.Zero,
        OPEN_EXISTING,
        FILE_ATTRIBUTE_NORMAL,
        IntPtr.Zero
      );
      
      if (hFile == (IntPtr)(-1)) {
        int error = Marshal.GetLastWin32Error();
        return "ERRO: Não foi possível abrir porta " + portName + ". Código: " + error;
      }
      
      // Escreve dados
      uint bytesWritten = 0;
      if (!WriteFile(hFile, data, (uint)data.Length, out bytesWritten, IntPtr.Zero)) {
        int error = Marshal.GetLastWin32Error();
        CloseHandle(hFile);
        return "ERRO: Falha ao escrever na porta. Código: " + error;
      }
      
      if (bytesWritten != data.Length) {
        CloseHandle(hFile);
        return "ERRO: Apenas " + bytesWritten + " de " + data.Length + " bytes foram escritos.";
      }
      
      CloseHandle(hFile);
      return "SUCESSO: " + bytesWritten + " bytes enviados para " + portName;
      
    } catch (Exception ex) {
      if (hFile != IntPtr.Zero) {
        CloseHandle(hFile);
      }
      return "ERRO: Exceção: " + ex.Message;
    }
  }
}`;

/**
 * Envia dados diretamente para porta USB (fallback quando spooler falhar)
 * @param {Buffer} dados - Dados ESC/POS
 * @param {string} portaUSB - Porta USB (ex: USB001 ou \\.\USB001)
 * @returns {Promise<{sucesso: boolean, erro?: string}>}
 */
/**
 * Descobre a porta COM real associada a uma impressora USB
 * IMPORTANTE: Impressoras USB podem usar porta COM ou porta USB virtual
 */
async function descobrirPortaReal(nomeImpressora) {
  try {
    const nomeEscapado = nomeImpressora.replace(/'/g, "''").replace(/"/g, '`"');
    const comando = `powershell -Command "$printer = Get-Printer -Name '${nomeEscapado}' -ErrorAction SilentlyContinue; if ($printer -and $printer.PortName) { Write-Output $printer.PortName } else { Write-Output 'NOT_FOUND' }"`;
    
    const { stdout } = await executarComando(comando, { timeout: 5000 });
    const porta = (stdout || '').trim();
    
    if (porta && porta !== 'NOT_FOUND') {
      const portaUpper = porta.toUpperCase();
      // Se é porta COM, pode ser acessada diretamente
      if (portaUpper.startsWith('COM')) {
        return portaUpper;
      }
      // Se é USB001, USB002, etc., não pode ser acessada diretamente
      // Retorna null para forçar uso do spooler
      return null;
    }
    
    return null;
  } catch (error) {
    console.warn(`⚠️ Erro ao descobrir porta: ${error.message}`);
    return null;
  }
}

async function enviarDiretoParaUSB(dados, portaUSB, nomeImpressora = null) {
  let arquivoCupom = null;
  let arquivoCS = null;
  
  try {
    console.log(`🔌 Tentando envio direto para impressora USB: ${portaUSB}`);
    
    // IMPORTANTE: Portas USB (USB001, USB002) não podem ser acessadas diretamente via CreateFile
    // Precisamos descobrir a porta COM real ou usar o nome da impressora no spooler
    // Se temos nome da impressora, descobrimos a porta COM real
    let portaReal = null;
    if (nomeImpressora) {
      console.log(`🔍 Descobrindo porta COM real da impressora "${nomeImpressora}"...`);
      portaReal = await descobrirPortaReal(nomeImpressora);
      
      if (portaReal) {
        console.log(`✅ Porta COM real encontrada: ${portaReal}`);
      } else {
        // Porta é USB001 ou similar - não pode ser acessada diretamente
        throw new Error(`Impressora usa porta USB virtual (não pode ser acessada diretamente). Use o spooler do Windows.`);
      }
    }
    
    // Se não tem porta COM, não pode usar envio direto
    if (!portaReal) {
      throw new Error('Não foi possível descobrir porta COM para envio direto. Use o spooler do Windows.');
    }
    
    // Normaliza nome da porta COM (adiciona \\.\ se necessário)
    let portaNormalizada = portaReal.trim();
    if (!portaNormalizada.startsWith('\\\\.\\')) {
      portaNormalizada = `\\\\.\\${portaNormalizada}`;
    }
    
    // Cria arquivo temporário com dados
    arquivoCupom = criarArquivoTemporario(dados, 'cupom', '.prn');
    console.log(`💾 Arquivo temporário criado: ${arquivoCupom} (${dados.length} bytes)`);
    
    // Cria arquivo C# temporário
    arquivoCS = path.join(require('os').tmpdir(), `usbdirect_${Date.now()}.cs`);
    fs.writeFileSync(arquivoCS, CODIGO_CSHARP_USB_DIRECT, 'utf8');
    
    // Comando PowerShell para executar C#
    const portaEscapada = portaNormalizada.replace(/\\/g, '\\\\');
    const arquivoCupomEscapado = arquivoCupom.replace(/\\/g, '\\\\').replace(/'/g, "''");
    const arquivoCSEscapado = arquivoCS.replace(/\\/g, '\\\\').replace(/'/g, "''");
    
    const comando = `powershell -Command "$porta = '${portaEscapada}'; $arquivo = '${arquivoCupomEscapado}'; $csFile = '${arquivoCSEscapado}'; try { $bytes = [System.IO.File]::ReadAllBytes($arquivo); $csCode = [System.IO.File]::ReadAllText($csFile); Add-Type -TypeDefinition $csCode; $resultado = [UsbDirectWriter]::WriteToUsbPort($porta, $bytes); Write-Output $resultado; if (-not $resultado.StartsWith('SUCESSO')) { Write-Error $resultado; exit 1 } } catch { Write-Error ('Erro: ' + $_.Exception.Message); exit 1 } finally { if (Test-Path $csFile) { Remove-Item $csFile -Force } }"`;
    
    const { stdout, stderr } = await executarComando(comando, {
      timeout: 30000,
      maxBuffer: 10 * 1024 * 1024
    });
    
    const resultadoCompleto = (stdout || '') + (stderr || '');
    
    if (resultadoCompleto.includes('SUCESSO')) {
      console.log(`✅ Dados enviados diretamente para porta COM: ${portaReal}`);
      console.log(`📊 Resposta: ${resultadoCompleto.trim()}`);
      
      // Aguarda um pouco para impressora processar
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return { sucesso: true };
    }
    
    const erro = resultadoCompleto || 'Erro desconhecido';
    console.error(`❌ Erro ao enviar para porta COM: ${erro}`);
    throw new Error(erro);
    
  } catch (error) {
    console.error(`❌ Falha no envio direto: ${error.message}`);
    throw error;
  } finally {
    // Remove arquivos temporários após delay
    if (arquivoCupom) {
      removerArquivoTemporarioComDelay(arquivoCupom, 5000);
    }
    if (arquivoCS && fs.existsSync(arquivoCS)) {
      try {
        setTimeout(() => fs.unlinkSync(arquivoCS), 2000);
      } catch {}
    }
  }
}

module.exports = {
  enviarDiretoParaUSB
};

