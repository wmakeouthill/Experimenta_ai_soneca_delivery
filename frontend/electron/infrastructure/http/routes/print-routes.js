/**
 * Rotas de Impressão
 * Responsabilidade: Definir endpoints HTTP para impressão
 */

const express = require('express');
const { validarEMapearDevicePath } = require('../../../core/printer/printer-validator');
const { converterParaEscPos } = require('../../../core/print/escpos-converter');
const { imprimirLocalmente } = require('../../../core/print/print-executor');
const { converterLogoParaBuffer } = require('../../../core/print/thermal-printer-service');

const router = express.Router();

/**
 * Valida request de impressão
 * @param {object} body - Body da requisição
 * @returns {{valido: boolean, erro?: string}}
 */
function validarRequest(body) {
  if (!body.pedidoId || typeof body.pedidoId !== 'string' || body.pedidoId.trim().length === 0) {
    return { valido: false, erro: 'pedidoId é obrigatório e deve ser uma string não vazia' };
  }

  if (!body.tipoImpressora || typeof body.tipoImpressora !== 'string') {
    return { valido: false, erro: 'tipoImpressora é obrigatório' };
  }

  if (!body.devicePath || typeof body.devicePath !== 'string' || body.devicePath.trim().length === 0) {
    return { valido: false, erro: 'devicePath é obrigatório' };
  }

  if (!body.dadosCupom || typeof body.dadosCupom !== 'string' || body.dadosCupom.trim().length === 0) {
    return { valido: false, erro: 'dadosCupom é obrigatório e deve ser uma string base64 válida' };
  }

  // Valida formato básico do devicePath (segurança)
  const devicePathSanitizado = body.devicePath.trim();
  if (devicePathSanitizado.includes('..') ||
    (devicePathSanitizado.startsWith('/') && !devicePathSanitizado.startsWith('/dev/'))) {
    return { valido: false, erro: 'devicePath inválido' };
  }

  return { valido: true };
}

/**
 * POST /imprimir/cupom-fiscal
 * Endpoint para imprimir cupom fiscal
 */
router.post('/imprimir/cupom-fiscal', async (req, res) => {
  try {
    console.log('📥 POST recebido em /imprimir/cupom-fiscal');
    console.log('📦 Body recebido:', JSON.stringify({
      pedidoId: req.body?.pedidoId,
      tipoImpressora: req.body?.tipoImpressora,
      devicePath: req.body?.devicePath,
      dadosCupomLength: req.body?.dadosCupom?.length || 0,
      logoBase64Length: req.body?.logoBase64?.length || 0
    }));

    // Validação
    const validacao = validarRequest(req.body);
    if (!validacao.valido) {
      return res.status(400).json({
        sucesso: false,
        mensagem: validacao.erro
      });
    }

    const { pedidoId, tipoImpressora, devicePath, dadosCupom } = req.body;
    const devicePathSanitizado = devicePath.trim();

    console.log('📄 Recebendo comando de impressão:', { pedidoId, tipoImpressora, devicePath: devicePathSanitizado });

    // Valida e mapeia devicePath
    console.log(`🔍 Validando devicePath: "${devicePathSanitizado}"`);
    const impressoraInfo = await validarEMapearDevicePath(devicePathSanitizado);

    if (!impressoraInfo) {
      console.error(`❌ Impressora não encontrada: "${devicePathSanitizado}"`);
      return res.status(400).json({
        sucesso: false,
        mensagem: `Impressora não encontrada: "${devicePathSanitizado}". Verifique se a impressora está instalada e disponível.`
      });
    }

    // Extrai devicePath real e nome da impressora
    const devicePathReal = typeof impressoraInfo === 'object'
      ? (impressoraInfo.devicePath || impressoraInfo.nome)
      : impressoraInfo;
    const nomeImpressora = typeof impressoraInfo === 'object'
      ? impressoraInfo.nome
      : null;

    console.log(`✅ Impressora validada: "${devicePathSanitizado}" → "${devicePathReal}"${nomeImpressora ? ` (nome: "${nomeImpressora}")` : ''}`);

    // Processa logo se presente (usa node-thermal-printer para conversão confiável)
    let logoEscPos = null;
    const logoBase64 = req.body.logoBase64;
    if (logoBase64 && logoBase64.length > 0) {
      console.log(`🖼️ Processando logo para impressão (${logoBase64.length} chars)...`);
      const logoResult = await converterLogoParaBuffer(logoBase64, tipoImpressora);
      if (logoResult.success && logoResult.buffer) {
        logoEscPos = logoResult.buffer;
        console.log(`✅ Logo convertido via node-thermal-printer: ${logoEscPos.length} bytes`);
      } else {
        console.warn(`⚠️ Falha ao processar logo: ${logoResult.error}`);
      }
    } else {
      console.log('ℹ️ Sem logo para imprimir (logoBase64 vazio ou não enviado)');
    }

    // Converte dados do cupom para ESC/POS
    console.log('🔄 Convertendo dados para ESC/POS...');
    const dadosEscPos = converterParaEscPos(dadosCupom, tipoImpressora);
    console.log(`✅ Dados convertidos: ${dadosEscPos.length} bytes`);

    // Monta buffer final: Logo (se houver) + Dados do cupom
    let bufferFinal;
    if (logoEscPos) {
      // Reset + Logo + Dados do cupom (que já tem inicialização mas será sobrescrita)
      const resetCmd = Buffer.from([0x1B, 0x40]); // ESC @
      bufferFinal = Buffer.concat([resetCmd, logoEscPos, dadosEscPos]);
      console.log(`✅ Buffer final com logo: ${bufferFinal.length} bytes`);
    } else {
      bufferFinal = dadosEscPos;
    }

    // Imprime
    console.log(`🖨️ Iniciando impressão em: "${devicePathReal}"${nomeImpressora ? ` (nome: "${nomeImpressora}")` : ''}`);

    let resultado;
    try {
      resultado = await imprimirLocalmente(bufferFinal, devicePathReal, tipoImpressora, nomeImpressora);
    } catch (error) {
      console.error('❌ Exceção ao imprimir:', error);
      console.error('❌ Stack trace:', error.stack);
      return res.status(500).json({
        sucesso: false,
        mensagem: `Erro ao imprimir: ${error.message || 'Erro desconhecido'}`
      });
    }

    if (resultado.sucesso) {
      console.log('✅ Impressão concluída com sucesso');
      res.json({
        sucesso: true,
        mensagem: 'Cupom impresso com sucesso',
        pedidoId,
        dataImpressao: new Date().toISOString()
      });
    } else {
      console.error('❌ Erro na impressão:', resultado.erro);
      res.status(500).json({
        sucesso: false,
        mensagem: resultado.erro || 'Erro desconhecido ao imprimir'
      });
    }
  } catch (error) {
    console.error('❌ Erro ao processar impressão:', error);
    res.status(500).json({
      sucesso: false,
      mensagem: error.message || 'Erro ao processar impressão'
    });
  }
});

/**
 * GET /health
 * Endpoint de saúde/status
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'online',
    plataforma: process.platform,
    timestamp: new Date().toISOString()
  });
});

/**
 * POST /teste/imprimir-simples
 * Endpoint para testar impressão com dados ESC/POS básicos
 */
router.post('/teste/imprimir-simples', async (req, res) => {
  try {
    const { devicePath, nomeImpressora } = req.body;

    // Se nomeImpressora foi fornecido, usa diretamente (mais rápido e confiável)
    // Caso contrário, usa devicePath
    const nomeParaUsar = nomeImpressora || devicePath;

    if (!nomeParaUsar) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'devicePath ou nomeImpressora é obrigatório'
      });
    }

    const devicePathParaUsar = devicePath || 'USB001';

    console.log(`🧪 TESTE: Enviando para impressora "${nomeParaUsar}" (devicePath: ${devicePathParaUsar})`);

    const path = require('path');
    const { testarImpressaoSimples } = require(path.join(__dirname, '../../os/teste-impressao-simples'));
    const resultado = await testarImpressaoSimples(nomeParaUsar, devicePathParaUsar);

    res.json({
      sucesso: resultado.sucesso,
      mensagem: resultado.sucesso ? 'Teste enviado com sucesso' : resultado.erro,
      nomeImpressoraUsado: nomeParaUsar,
      devicePathUsado: devicePathParaUsar
    });
  } catch (error) {
    console.error('❌ Erro no teste:', error);
    res.status(500).json({
      sucesso: false,
      mensagem: error.message || 'Erro ao testar impressão'
    });
  }
});

/**
 * POST /teste/cupom-completo
 * Endpoint para testar impressão com cupom completo simulado
 */
router.post('/teste/cupom-completo', async (req, res) => {
  try {
    const { devicePath, nomeImpressora } = req.body;

    const nomeParaUsar = nomeImpressora || devicePath || 'DIABO';
    const devicePathParaUsar = devicePath || 'USB001';

    console.log(`🧪 TESTE CUPOM COMPLETO: Enviando para impressora "${nomeParaUsar}" (devicePath: ${devicePathParaUsar})`);

    const path = require('path');
    const { testarCupomCompleto } = require(path.join(__dirname, '../../os/teste-cupom-completo'));
    const resultado = await testarCupomCompleto(nomeParaUsar, devicePathParaUsar);

    res.json({
      sucesso: resultado.sucesso,
      mensagem: resultado.sucesso ? 'Cupom completo simulado enviado com sucesso' : resultado.erro,
      nomeImpressoraUsado: nomeParaUsar,
      devicePathUsado: devicePathParaUsar,
      tamanho: resultado.tamanho
    });
  } catch (error) {
    console.error('❌ Erro no teste cupom completo:', error);
    res.status(500).json({
      sucesso: false,
      mensagem: error.message || 'Erro ao testar impressão'
    });
  }
});

module.exports = router;

