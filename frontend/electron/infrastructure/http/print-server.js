/**
 * Servidor HTTP Local para Impressão
 * Responsabilidade: Inicializar e gerenciar servidor Express para receber comandos de impressão
 */

const express = require('express');
const { corsMiddleware } = require('./middleware/cors-middleware');
const { rateLimitMiddleware, limparRateLimit } = require('./middleware/rate-limit-middleware');
const printRoutes = require('./routes/print-routes');

let server = null;
let portaAtual = null;

/**
 * Inicia o servidor HTTP local
 * @param {number} porta - Porta para escutar (padrão: 3001)
 * @returns {Promise<number>} - Porta onde o servidor está rodando
 */
async function iniciarServidor(porta = 3001) {
  if (server) {
    console.log('Servidor de impressão já está rodando na porta', portaAtual);
    return portaAtual;
  }

  const app = express();

  // Segurança: Limita tamanho de requisição (10MB para logos)
  app.use(express.json({ limit: '10mb' }));

  // Middlewares
  app.use(corsMiddleware);
  app.use(rateLimitMiddleware);

  // Rotas
  app.use('/', printRoutes);

  return new Promise((resolve, reject) => {
    const tentarIniciar = (portaTentativa) => {
      server = app.listen(portaTentativa, 'localhost', (error) => {
        if (error) {
          if (error.code === 'EADDRINUSE') {
            console.log(`Porta ${portaTentativa} ocupada, tentando ${portaTentativa + 1}...`);
            tentarIniciar(portaTentativa + 1);
          } else {
            reject(error);
          }
        } else {
          portaAtual = portaTentativa;
          console.log(`✅ Servidor de impressão local iniciado em http://localhost:${portaAtual}`);
          resolve(portaAtual);
        }
      });
    };

    tentarIniciar(porta);
  });
}

/**
 * Para o servidor HTTP local
 * @returns {Promise<void>}
 */
function pararServidor() {
  if (!server) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    try {
      const servidorParaFechar = server;
      server = null;
      portaAtual = null;
      limparRateLimit();

      servidorParaFechar.close(() => {
        console.log('✅ Servidor de impressão local parado corretamente');
        resolve();
      });

      if (servidorParaFechar.closeAllConnections) {
        servidorParaFechar.closeAllConnections();
      }

      setTimeout(() => {
        resolve();
      }, 500);
    } catch (error) {
      console.error('❌ Erro ao parar servidor de impressão:', error);
      server = null;
      portaAtual = null;
      limparRateLimit();
      resolve();
    }
  });
}

/**
 * Retorna a porta atual do servidor
 * @returns {number|null} - Porta atual ou null se não estiver rodando
 */
function obterPorta() {
  return portaAtual;
}

module.exports = {
  iniciarServidor,
  pararServidor,
  obterPorta
};

