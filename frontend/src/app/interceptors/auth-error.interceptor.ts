import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

// Rotas públicas que não devem redirecionar para login em caso de erro 401/403
const ROTAS_PUBLICAS = ['/mesa/', '/pedido-mesa/', '/delivery/', '/cadastro-motoboy', '/motoboy/', '/api/public/', '/api/publico/', '/api/cliente/', '/api/motoboy/'];

/**
 * Interceptor para tratar erros de autenticação (401, 403).
 * Redireciona para login quando o token é inválido ou expirado.
 * Ignora erros em rotas públicas e endpoints de cliente.
 */
export const authErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Verificar se é uma rota pública (não deve redirecionar)
      const isRotaPublica = typeof window !== 'undefined' &&
        ROTAS_PUBLICAS.some(rota => window.location.pathname.includes(rota));

      // Verificar se a REQUISIÇÃO HTTP é para endpoint público ou de cliente
      // (importante: verifica a URL da requisição, não só o pathname do navegador)
      const isUrlPublicaOuCliente = ROTAS_PUBLICAS.some(rota => req.url.includes(rota));

      // Verificar se a requisição é para endpoint público, de cliente ou de motoboy
      const isEndpointPublicoOuCliente = req.url.includes('/api/public/') ||
        req.url.includes('/api/publico/') ||
        req.url.includes('/api/cliente/') ||
        req.url.includes('/api/motoboy/');

      // Tratar apenas erros de autenticação/autorização em rotas protegidas
      // NÃO redirecionar se a URL da requisição for para cliente/público (mesmo que pathname seja diferente)
      if ((error.status === 401 || error.status === 403) && !isRotaPublica && !isEndpointPublicoOuCliente && !isUrlPublicaOuCliente) {
        // Limpar dados de autenticação
        authService.logout();

        // Redirecionar para login apenas se não estiver já na página de login
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          const returnUrl = router.url;
          router.navigate(['/login'], {
            queryParams: {
              returnUrl: returnUrl,
              reason: error.status === 401 ? 'unauthorized' : 'forbidden'
            }
          });
        }
      }

      // Propagar o erro para tratamento específico nos componentes
      return throwError(() => error);
    })
  );
};

