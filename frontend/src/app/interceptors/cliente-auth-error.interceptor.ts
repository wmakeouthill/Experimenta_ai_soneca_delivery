import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ClienteAuthService } from '../services/cliente-auth.service';

/**
 * Interceptor para detectar sessão de cliente quebrada (id inexistente no backend)
 * e limpar storage forçando novo login.
 */
export const clienteAuthErrorInterceptor: HttpInterceptorFn = (req, next) => {
  // Aplica apenas em endpoints de cliente
  if (!req.url.includes('/api/cliente/')) {
    return next(req);
  }

  const clienteAuth = inject(ClienteAuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Comportamento similar ao motoboyAuthErrorInterceptor - só limpa em casos específicos
      // - 404 com mensagem de cliente não encontrado
      // - 401 com mensagem específica de token inválido/expirado
      // NÃO limpa em 500 (erro interno do servidor - pode ser temporário)
      // NÃO limpa em 401 genérico sem mensagem específica (pode ser erro temporário)

      const mensagem = (error.error && (error.error.message || error.error.error || '')) as string;
      const clienteNaoEncontrado = mensagem?.toLowerCase().includes('cliente não encontrado');
      const tokenInvalido = mensagem?.toLowerCase().includes('token jwt inválido') ||
        mensagem?.toLowerCase().includes('token jwt expirado') ||
        mensagem?.toLowerCase().includes('token é obrigatório');

      // Só limpa sessão se for erro específico de autenticação/autorização
      if (error.status === 404 && clienteNaoEncontrado) {
        clienteAuth.logout();
        console.warn('⚠️ Cliente não encontrado (404). Limpando sessão e redirecionando para login.');
        if (typeof window !== 'undefined') {
          window.location.href = '/delivery';
        }
      } else if (error.status === 401 && tokenInvalido) {
        // Só limpa se for erro específico de token inválido/expirado
        clienteAuth.logout();
        console.warn('⚠️ Token JWT inválido ou expirado. Limpando sessão e redirecionando para login.');
        if (typeof window !== 'undefined') {
          window.location.href = '/delivery';
        }
      }
      // Em caso de erro 500 ou 401 genérico, não limpa a sessão (pode ser erro temporário)

      return throwError(() => error);
    })
  );
};
