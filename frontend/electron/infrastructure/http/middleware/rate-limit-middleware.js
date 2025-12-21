/**
 * Middleware Rate Limiting
 * Responsabilidade: Limitar número de requisições por IP
 */

const RATE_LIMIT_WINDOW = 60000; // 1 minuto
const RATE_LIMIT_MAX = 10; // Máximo 10 requisições por minuto

const rateLimit = new Map();

/**
 * Verifica se o IP excedeu o rate limit
 * @param {string} ip - IP da requisição
 * @returns {boolean} - true se permitido, false se excedeu limite
 */
function verificarRateLimit(ip) {
  const agora = Date.now();
  const limite = rateLimit.get(ip) || { count: 0, resetTime: agora + RATE_LIMIT_WINDOW };

  if (agora > limite.resetTime) {
    limite.count = 0;
    limite.resetTime = agora + RATE_LIMIT_WINDOW;
  }

  if (limite.count >= RATE_LIMIT_MAX) {
    return false;
  }

  limite.count++;
  rateLimit.set(ip, limite);
  return true;
}

/**
 * Limpa o rate limit (útil para testes ou reset)
 */
function limparRateLimit() {
  rateLimit.clear();
}

/**
 * Middleware de rate limiting para Express
 * @param {object} req - Request do Express
 * @param {object} res - Response do Express
 * @param {function} next - Next middleware
 */
function rateLimitMiddleware(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';

  if (!verificarRateLimit(ip)) {
    console.warn(`⚠️ Rate limit excedido para IP: ${ip}`);
    return res.status(429).json({
      sucesso: false,
      mensagem: 'Muitas requisições. Tente novamente em alguns segundos.'
    });
  }

  next();
}

module.exports = {
  rateLimitMiddleware,
  verificarRateLimit,
  limparRateLimit
};

