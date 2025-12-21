/**
 * Middleware CORS
 * Responsabilidade: Configurar CORS para permitir requisições do backend online
 */

const ORIGINS_PERMITIDAS = [
  'https://experimenta-ai-soneca-699875180084.southamerica-east1.run.app',
  'http://localhost:4200',
  'http://127.0.0.1:4200'
];

/**
 * Verifica se a requisição é de origem permitida
 * @param {string} origin - Origin da requisição
 * @param {string} ip - IP da requisição
 * @returns {boolean} - true se permitido, false caso contrário
 */
function eOrigemPermitida(origin, ip) {
  // Permite requisições sem Origin (backend local)
  if (!origin) {
    return true;
  }

  // Permite localhost e 127.0.0.1
  if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
    return true;
  }

  // Permite origins na lista de permitidas
  if (ORIGINS_PERMITIDAS.includes(origin)) {
    return true;
  }

  // Permite mesmo IP da máquina (backend local)
  if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('127.') || ip.startsWith('::ffff:127.')) {
    return true;
  }

  return false;
}

/**
 * Middleware CORS para Express
 * @param {object} req - Request do Express
 * @param {object} res - Response do Express
 * @param {function} next - Next middleware
 */
function corsMiddleware(req, res, next) {
  const origin = req.headers.origin;
  const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';

  if (eOrigemPermitida(origin, ip)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
  } else {
    console.warn(`⚠️ Requisição bloqueada (não local): ${origin || 'sem origin'} de IP ${ip}`);
    return res.status(403).send('Forbidden');
  }

  next();
}

module.exports = {
  corsMiddleware
};

