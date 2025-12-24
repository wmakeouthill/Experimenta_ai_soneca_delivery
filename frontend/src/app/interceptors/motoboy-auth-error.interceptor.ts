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
      // Só limpa sessão em casos específicos:
      // - 404: Motoboy não encontrado no backend
      // - 401 com mensagem específica de motoboy não encontrado
      // Não limpa em 401 genérico (pode ser token expirado, mas motoboy existe)
      // Não limpa em 500 (erro interno do servidor)
      
      if (error.status === 404) {
        // 404 sempre indica que o motoboy não existe mais
        motoboyAuth.logout();
        console.warn('⚠️ Motoboy não encontrado (404). Limpando sessão e redirecionando para login.');
        // Redireciona para login
        if (typeof window !== 'undefined') {
          window.location.href = '/cadastro-motoboy';
        }
      } else if (error.status === 401) {
        const mensagem = (error.error && (error.error.message || error.error.error || '')) as string;
        const motoboyNaoEncontrado = mensagem?.toLowerCase().includes('motoboy não encontrado');
        const tokenInvalido = mensagem?.toLowerCase().includes('token jwt inválido') || 
                              mensagem?.toLowerCase().includes('token jwt expirado');

        // Se o backend não localizar o motoboy vinculado ao header, limpamos sessão
        if (motoboyNaoEncontrado) {
          motoboyAuth.logout();
          console.warn('⚠️ Motoboy não encontrado no backend. Limpando sessão e redirecionando para login.');
          if (typeof window !== 'undefined') {
            window.location.href = '/cadastro-motoboy';
          }
        } else if (tokenInvalido) {
          // Token inválido/expirado - limpa sessão e redireciona
          motoboyAuth.logout();
          console.warn('⚠️ Token JWT inválido ou expirado. Limpando sessão e redirecionando para login.');
          if (typeof window !== 'undefined') {
            window.location.href = '/cadastro-motoboy';
          }
        }
        // Se for 401 genérico sem mensagem específica, não limpa (pode ser erro temporário)
      }
      // Em caso de erro 500, não limpa a sessão (pode ser erro temporário do servidor)

      return throwError(() => error);
    })
  );
};

