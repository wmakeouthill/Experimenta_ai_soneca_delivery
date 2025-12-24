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
      // Só limpa sessão em erros específicos (404, 401) ou quando o motoboy não é encontrado
      // Não limpa em erros 500 (erro interno do servidor)
      if (error.status === 404 || error.status === 401) {
        const mensagem = (error.error && (error.error.message || error.error.error || '')) as string;
        const motoboyNaoEncontrado = mensagem?.toLowerCase().includes('motoboy não encontrado');

        // Se o backend não localizar o motoboy vinculado ao header, limpamos sessão e avisamos
        if (motoboyNaoEncontrado || error.status === 404) {
          motoboyAuth.logout();
          console.warn('Sessão de motoboy inválida: realizando logout para forçar novo login.');
        }
      }
      // Em caso de erro 500, não limpa a sessão (pode ser erro temporário do servidor)

      return throwError(() => error);
    })
  );
};

