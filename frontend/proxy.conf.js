// Proxy otimizado com buffering para melhor performance
const PROXY_CONFIG = {
  "/api": {
    // Usa backend-dev (Docker) ou localhost (local)
    "target": process.env.BACKEND_URL || (process.env.DOCKER_ENV ? "http://backend-dev:8080" : "http://localhost:8080"),
    "secure": false,
    "changeOrigin": true,
    "logLevel": "warn",
    
    // ========== BUFFERING E PERFORMANCE ==========
    // Timeout de conexão
    "timeout": 30000,
    "proxyTimeout": 30000,
    
    // Desabilita streaming para buffering completo (evita byte-a-byte)
    "selfHandleResponse": false,
    
    // Headers para melhor performance
    "headers": {
      "Connection": "keep-alive",
      "Accept-Encoding": "gzip, deflate, br"
    },
    
    // Callback para otimizar response
    "onProxyRes": function(proxyRes, req, res) {
      // Remove headers que podem causar streaming lento
      delete proxyRes.headers['transfer-encoding'];
      
      // Adiciona headers de cache para assets estáticos da API
      if (req.url.includes('/public/')) {
        proxyRes.headers['cache-control'] = 'public, max-age=300';
      }
    },
    
    // Configuração de agente HTTP com keep-alive
    "agent": false
  }
};

module.exports = PROXY_CONFIG;
