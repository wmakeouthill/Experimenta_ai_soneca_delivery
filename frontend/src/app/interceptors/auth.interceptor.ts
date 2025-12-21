import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Interceptor que adiciona o token JWT e o ID do usuário em todas as requisições HTTP
 * O token é obtido do localStorage e adicionado no header Authorization
 * O ID do usuário é adicionado no header X-Usuario-Id
 *
 * NOTA: Não adiciona token em requisições para servidor local do Electron (portas específicas)
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Não adiciona token em requisições para servidor local do Electron
  // Portas típicas do servidor Electron: 3847, 3000 (diferente da 4200 do Angular dev server)
  // Requisições para /api/* devem sempre ter o token (mesmo via proxy em localhost:4200)
  const isServidorElectronLocal =
    (req.url.startsWith('http://localhost:') || req.url.startsWith('http://127.0.0.1:')) &&
    !req.url.includes('/api/') && // Requisições para API devem ter token
    (req.url.includes(':3847') || req.url.includes(':3000')); // Portas do Electron

  if (isServidorElectronLocal) {
    return next(req);
  }

  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
  const usuarioStr = typeof localStorage !== 'undefined' ? localStorage.getItem('usuario') : null;

  if (token) {
    // Remove espaços e quebras de linha do token (caso tenha sido salvo incorretamente)
    const tokenLimpo = token.trim();

    if (tokenLimpo) {
      // Prepara os headers
      const headers: Record<string, string> = {
        Authorization: `Bearer ${tokenLimpo}`
      };

      // Adiciona X-Usuario-Id se tiver usuário logado
      if (usuarioStr) {
        try {
          const usuario = JSON.parse(usuarioStr);
          if (usuario?.id) {
            headers['X-Usuario-Id'] = usuario.id;
          }
        } catch {
          // Ignora erro de parse
        }
      }

      const cloned = req.clone({
        setHeaders: headers
      });

      // Log apenas em desenvolvimento para debug
      if (process.env['NODE_ENV'] !== 'production') {
        console.debug('Token JWT adicionado à requisição:', req.url);
      }

      return next(cloned);
    } else {
      console.warn('Token encontrado no localStorage mas está vazio');
    }
  } else {
    // Log apenas em desenvolvimento
    if (process.env['NODE_ENV'] !== 'production') {
      console.debug('Nenhum token encontrado no localStorage para:', req.url);
    }
  }

  return next(req);
};

