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
      const mensagem = (error.error && (error.error.message || error.error.error || '')) as string;
      const clienteNaoEncontrado = mensagem?.toLowerCase().includes('cliente não encontrado');

      // Se o backend não localizar o cliente vinculado ao header, limpamos sessão e avisamos
      if (clienteNaoEncontrado) {
        clienteAuth.logout();
        console.warn('Sessão de cliente inválida: realizando logout para forçar novo login.');
      }

      return throwError(() => error);
    })
  );
};
