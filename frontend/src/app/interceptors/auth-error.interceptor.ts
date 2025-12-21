import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

// Rotas públicas que não devem redirecionar para login em caso de erro 401/403
const ROTAS_PUBLICAS = ['/mesa/', '/pedido-mesa/', '/api/public/'];

// Rotas que devem exibir erro em vez de redirecionar (usuário deve fazer login manualmente)
const ROTAS_TOTEM = ['/autoatendimento'];

/**
 * Interceptor para tratar erros de autenticação (401, 403).
 * Redireciona para login quando o token é inválido ou expirado.
 * Ignora erros em rotas públicas.
 */
export const authErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Verificar se é uma rota pública (não deve redirecionar)
      const isRotaPublica = typeof window !== 'undefined' &&
        ROTAS_PUBLICAS.some(rota => window.location.pathname.includes(rota));

      // Verificar se é rota de totem (não redireciona automaticamente - exibe erro)
      const isRotaTotem = typeof window !== 'undefined' &&
        ROTAS_TOTEM.some(rota => window.location.pathname.includes(rota));

      // Verificar se a requisição é para endpoint público
      const isEndpointPublico = req.url.includes('/api/public/');

      // Para rotas de totem, não fazer logout automático - deixa o componente tratar
      if ((error.status === 401 || error.status === 403) && isRotaTotem) {
        console.warn('[AUTH] Erro de autenticação no totem - verifique se o operador está logado');
        return throwError(() => error);
      }

      // Tratar apenas erros de autenticação/autorização em rotas protegidas
      if ((error.status === 401 || error.status === 403) && !isRotaPublica && !isEndpointPublico) {
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

