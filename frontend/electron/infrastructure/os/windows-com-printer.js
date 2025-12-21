/**
 * Impressora Windows - Porta COM
 * Responsabilidade: Enviar dados para porta COM serial
 */

const fs = require('fs');
const path = require('path');
const { executarComando } = require('../../utils/exec-utils');
const { criarArquivoTemporario, removerArquivoTemporario } = require('../../utils/file-utils');

/**
 * Verifica se uma porta COM existe e está acessível
 * @param {string} portaCOM - Porta COM (ex: COM3)
 * @returns {Promise<boolean>}
 */
async function verificarPortaCOMExiste(portaCOM) {
  try {
    // Usa mode para verificar se a porta existe (retorna erro se não existir)
    const comando = `mode ${portaCOM} status`;
    await executarComando(comando, { timeout: 3000 });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Configura porta COM para impressora ESC/POS
 * @param {string} portaCOM - Porta COM (ex: COM3)
 * @returns {Promise<boolean>}
 */
async function configurarPortaCOM(portaCOM) {
  // Remove dois pontos se houver (COM1: -> COM1)
  const portaLimpa = portaCOM.replace(':', '').trim();
  
  // Tenta diferentes baudrates comuns para impressoras ESC/POS
  const baudrates = [9600, 115200, 19200, 38400];
  
  for (const baudrate of baudrates) {
    try {
      console.log(`⚙️ Tentando configurar porta ${portaLimpa} com: ${baudrate},8,N,1`);
      
      // Configura porta COM com parâmetros para impressoras ESC/POS
      const comando = `mode ${portaLimpa} BAUD=${baudrate} DATA=8 PARITY=N STOP=1`;
      
      await executarComando(comando, { timeout: 5000 });
      console.log(`✅ Porta ${portaLimpa} configurada com sucesso (${baudrate} baud)`);
      
      // Aguarda um pouco para garantir que a configuração foi aplicada
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return true;
    } catch (error) {
      console.warn(`⚠️ Não foi possível configurar porta ${portaLimpa} com ${baudrate}: ${error.message}`);
      // Tenta próximo baudrate
    }
  }
  
  console.warn(`⚠️ Não foi possível configurar porta ${portaLimpa} com nenhum baudrate. Continuando mesmo assim...`);
  return false;
}

/**
 * Envia dados para porta COM usando método mais robusto
 * @param {Buffer} dados - Dados ESC/POS binários
 * @param {string} portaCOM - Porta COM (ex: COM3)
 * @returns {Promise<{sucesso: boolean, erro?: string}>}
 */
async function enviarParaPortaCOM(dados, portaCOM, pularVerificacao = false) {
  console.log(`📡 Tentando enviar para porta COM: ${portaCOM}`);
  
  // Remove dois pontos se houver (COM1: -> COM1)
  const portaLimpa = portaCOM.replace(':', '').trim();
  
  // Verifica se a porta existe antes de tentar enviar (a menos que seja solicitado pular)
  if (!pularVerificacao) {
    const portaExiste = await verificarPortaCOMExiste(portaLimpa);
    if (!portaExiste) {
      console.warn(`⚠️ Porta ${portaLimpa} não passou na verificação inicial, mas tentando mesmo assim...`);
      // Não lança erro, apenas tenta mesmo assim
    } else {
      console.log(`✅ Porta ${portaLimpa} verificada.`);
    }
  }
  
  // Tenta liberar/desbloquear a porta antes de usar
  try {
    console.log(`🔓 Tentando liberar porta ${portaLimpa}...`);
    // Tenta abrir e fechar a porta para garantir que está livre
    const comandoStatus = `mode ${portaLimpa} status`;
    await executarComando(comandoStatus, { timeout: 2000 });
    console.log(`✅ Porta ${portaLimpa} está acessível`);
  } catch (error) {
    console.warn(`⚠️ Porta ${portaLimpa} pode estar bloqueada ou em uso: ${error.message}`);
  }
  
  // Configura porta COM antes de enviar
  await configurarPortaCOM(portaLimpa);
  
  // Aguarda um pouco após configurar
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const arquivoTemp = criarArquivoTemporario(dados, 'cupom', '.prn');
  console.log(`💾 Arquivo temporário criado: ${arquivoTemp} (${dados.length} bytes)`);
  
  // Verifica primeiros bytes para garantir que tem comando de inicialização
  const primeirosBytes = dados.slice(0, 2);
  if (primeirosBytes[0] === 0x1B && primeirosBytes[1] === 0x40) {
    console.log(`✅ Dados começam com ESC @ (inicialização detectada)`);
  } else {
    console.warn(`⚠️ Dados podem não começar com ESC @: ${primeirosBytes.toString('hex')}`);
  }

  try {
    // MÉTODO 1: Tenta usar PowerShell com .NET SerialPort (mais confiável)
    console.log(`📤 Tentando enviar via PowerShell .NET SerialPort...`);
    try {
      // Cria script PowerShell temporário para evitar problemas de escape
      const scriptPS = path.join(require('os').tmpdir(), `send_com_${Date.now()}.ps1`);
      const scriptContent = `
$portName = '${portaLimpa}'
$filePath = '${arquivoTemp.replace(/\\/g, '/')}'
try {
  $port = New-Object System.IO.Ports.SerialPort
  $port.PortName = $portName
  $port.BaudRate = 9600
  $port.Parity = [System.IO.Ports.Parity]::None
  $port.DataBits = 8
  $port.StopBits = [System.IO.Ports.StopBits]::One
  $port.Handshake = [System.IO.Ports.Handshake]::None
  $port.ReadTimeout = 1000
  $port.WriteTimeout = 5000
  $port.Open()
  $data = [System.IO.File]::ReadAllBytes($filePath)
  $port.Write($data, 0, $data.Length)
  Start-Sleep -Milliseconds 500
  $port.Close()
  Write-Output "SUCESSO: Dados enviados via SerialPort para ${portaLimpa}"
} catch {
  if ($port -and $port.IsOpen) { $port.Close() }
  Write-Error $_.Exception.Message
  exit 1
}
`;
      fs.writeFileSync(scriptPS, scriptContent, 'utf8');
      
      const comandoPS = `powershell -ExecutionPolicy Bypass -File "${scriptPS}"`;
      const { stdout, stderr } = await executarComando(comandoPS, { timeout: 15000 });
      
      // Remove script temporário
      try { fs.unlinkSync(scriptPS); } catch {}
      
      if (stdout && stdout.includes('SUCESSO')) {
        console.log(`✅ ${stdout.trim()}`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        return { sucesso: true };
      } else {
        console.warn(`⚠️ PowerShell SerialPort falhou: ${stdout || stderr || 'erro desconhecido'}`);
      }
    } catch (psError) {
      console.warn(`⚠️ Erro ao usar PowerShell SerialPort: ${psError.message}`);
      console.log(`📤 Tentando método alternativo: copy /b...`);
    }
    
    // MÉTODO 2: Fallback para copy /b
    // IMPORTANTE: Remove dois pontos da porta para o comando copy
    const comando = `copy /b "${arquivoTemp}" ${portaLimpa} 2>&1`;
    console.log(`📤 Executando: copy /b para ${portaLimpa}`);
    
    const { stdout, stderr } = await executarComando(comando, { timeout: 15000 });
    
    const outputCompleto = (stdout || '') + (stderr || '');
    console.log(`📄 Output completo do copy: "${outputCompleto || '(vazio)'}"`);
    
    // Verifica se realmente copiou os dados (copy retorna mensagem de confirmação)
    const copiou = outputCompleto.includes('copied') || 
                   outputCompleto.includes('copiado') || 
                   outputCompleto.includes('copiados') ||
                   outputCompleto.includes('arquivo(s) copiado');
    
    if (copiou) {
      console.log(`✅ Copy confirmado: ${outputCompleto.trim()}`);
      console.log(`ℹ️ Dados foram enviados para ${portaLimpa}, mas a impressora pode não estar processando.`);
      console.log(`ℹ️ Verificações: 1) Impressora ligada? 2) Velocidade correta? 3) Cabo conectado? 4) Outro programa usando a porta?`);
    } else if (outputCompleto.toLowerCase().includes('erro') || 
               outputCompleto.toLowerCase().includes('error') ||
               outputCompleto.toLowerCase().includes('cannot') ||
               outputCompleto.toLowerCase().includes('não é possível') ||
               outputCompleto.toLowerCase().includes('acesso negado') ||
               outputCompleto.toLowerCase().includes('denied') ||
               outputCompleto.toLowerCase().includes('não pode encontrar') ||
               outputCompleto.toLowerCase().includes('cannot find')) {
      
      // Verifica se é erro de porta não encontrada
      if (outputCompleto.toLowerCase().includes('não pode encontrar') || 
          outputCompleto.toLowerCase().includes('cannot find')) {
        throw new Error(`Porta ${portaLimpa} não existe fisicamente. A porta pode estar configurada no Windows mas não existe no hardware. Verifique no Gerenciador de Dispositivos se a porta COM está realmente conectada.`);
      }
      
      throw new Error(`Comando copy falhou para ${portaLimpa}: ${outputCompleto.trim()}`);
    } else {
      // Se não há confirmação explícita, mas também não há erro, assume que funcionou
      console.warn(`⚠️ Copy executado para ${portaLimpa}, mas sem confirmação explícita. Output: ${outputCompleto.trim() || '(vazio)'}`);
      console.warn(`⚠️ ATENÇÃO: Pode não ter enviado dados. Verifique se a impressora imprimiu.`);
    }
    
    // Aguarda um pouco mais para garantir que os dados foram enviados e processados
    console.log(`⏳ Aguardando impressora processar dados (3 segundos)...`);
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log(`✅ Dados enviados para ${portaLimpa}. Se não imprimiu, verifique configurações da impressora.`);
    console.log(`💡 DICA: Verifique nas Propriedades da Impressora → Portas → Configurar Porta se a velocidade está correta (geralmente 9600 ou 115200).`);
    return { sucesso: true };
  } catch (error) {
    console.error(`❌ Erro ao enviar para ${portaLimpa}:`, error.message);
    throw error; // Re-lança o erro original
  } finally {
    // Mantém arquivo temporário por mais tempo para debug se necessário
    setTimeout(() => {
      removerArquivoTemporario(arquivoTemp);
    }, 5000);
  }
}

module.exports = {
  enviarParaPortaCOM,
  verificarPortaCOMExiste,
  configurarPortaCOM
};

