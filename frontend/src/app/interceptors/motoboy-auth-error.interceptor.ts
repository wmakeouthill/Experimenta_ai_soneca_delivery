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
      // - 401 com mensagem específica de motoboy não encontrado ou token inválido/expirado
      // NÃO limpa em 500 (erro interno do servidor - pode ser temporário)
      // NÃO limpa em 401 genérico sem mensagem específica (pode ser erro temporário)
      
      if (error.status === 404) {
        // 404 sempre indica que o motoboy não existe mais
        const mensagem = (error.error && (error.error.message || error.error.error || '')) as string;
        const motoboyNaoEncontrado = mensagem?.toLowerCase().includes('motoboy não encontrado');
        
        if (motoboyNaoEncontrado || !mensagem) {
          // Só limpa se for realmente motoboy não encontrado
          motoboyAuth.logout();
          console.warn('⚠️ Motoboy não encontrado (404). Limpando sessão e redirecionando para login.');
          if (typeof window !== 'undefined') {
            window.location.href = '/cadastro-motoboy';
          }
        }
      } else if (error.status === 401) {
        const mensagem = (error.error && (error.error.message || error.error.error || '')) as string;
        const motoboyNaoEncontrado = mensagem?.toLowerCase().includes('motoboy não encontrado');
        const tokenInvalido = mensagem?.toLowerCase().includes('token jwt inválido') || 
                              mensagem?.toLowerCase().includes('token jwt expirado') ||
                              mensagem?.toLowerCase().includes('token é obrigatório');

        // Só limpa sessão se for erro específico de autenticação
        if (motoboyNaoEncontrado || tokenInvalido) {
          motoboyAuth.logout();
          console.warn('⚠️ Erro de autenticação. Limpando sessão e redirecionando para login.', {
            motoboyNaoEncontrado,
            tokenInvalido,
            mensagem
          });
          if (typeof window !== 'undefined') {
            window.location.href = '/cadastro-motoboy';
          }
        } else {
          // 401 genérico sem mensagem específica - não limpa (pode ser erro temporário)
          console.warn('⚠️ Erro 401 genérico. Mantendo sessão (pode ser erro temporário).', mensagem);
        }
      }
      // Em caso de erro 500, não limpa a sessão (pode ser erro temporário do servidor)

      return throwError(() => error);
    })
  );
};

