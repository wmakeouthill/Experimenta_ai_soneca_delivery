import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { MotoboyAuthService } from '../services/motoboy-auth.service';

/**
 * Interceptor para detectar sessão de motoboy quebrada (id inexistente no backend)
 * e limpar storage forçando novo login.
 */
export const motoboyAuthErrorInterceptor: HttpInterceptorFn = (req, next) => {
  // Aplica apenas em endpoints de motoboy
  if (!req.url.includes('/api/motoboy/')) {
    return next(req);
  }

  const motoboyAuth = inject(MotoboyAuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Comportamento similar ao clienteAuthErrorInterceptor - só limpa em casos específicos
      // - 404 com mensagem de motoboy não encontrado
      // - 401 com mensagem específica de token inválido/expirado
      // NÃO limpa em 500 (erro interno do servidor - pode ser temporário)
      // NÃO limpa em 401 genérico sem mensagem específica (pode ser erro temporário)
      
      const mensagem = (error.error && (error.error.message || error.error.error || '')) as string;
      const motoboyNaoEncontrado = mensagem?.toLowerCase().includes('motoboy não encontrado');
      const tokenInvalido = mensagem?.toLowerCase().includes('token jwt inválido') || 
                            mensagem?.toLowerCase().includes('token jwt expirado') ||
                            mensagem?.toLowerCase().includes('token é obrigatório');

      // Só limpa sessão se for erro específico de autenticação/autorização
      if (error.status === 404 && motoboyNaoEncontrado) {
        motoboyAuth.logout();
        console.warn('⚠️ Motoboy não encontrado (404). Limpando sessão e redirecionando para login.');
        if (typeof window !== 'undefined') {
          window.location.href = '/cadastro-motoboy';
        }
      } else if (error.status === 401 && tokenInvalido) {
        // Só limpa se for erro específico de token inválido/expirado
        motoboyAuth.logout();
        console.warn('⚠️ Token JWT inválido ou expirado. Limpando sessão e redirecionando para login.');
        if (typeof window !== 'undefined') {
          window.location.href = '/cadastro-motoboy';
        }
      }
      // Em caso de erro 500 ou 401 genérico, não limpa a sessão (pode ser erro temporário)

      return throwError(() => error);
    })
  );
};

