import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Interceptor para requisições de sessão ativa.
 * 
 * NOTA: O log "404 (Not Found)" que aparece no console do navegador
 * vem do DevTools do navegador (Network tab), não do código JavaScript.
 * Este é um comportamento esperado quando não há sessão ativa e não pode
 * ser completamente suprimido sem afetar outras funcionalidades do DevTools.
 * 
 * O erro 404 é tratado silenciosamente no serviço (retorna null),
 * então não há impacto funcional - apenas um log informativo no console.
 */
export const silent404Interceptor: HttpInterceptorFn = (req, next) => {
  // Para o endpoint de sessão ativa, apenas passar adiante
  // O serviço já trata o 404 adequadamente retornando null
  return next(req);
};

