import { HttpInterceptorFn, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { catchError, of } from 'rxjs';

/**
 * Interceptor para tratar erros 500 no endpoint de configuração de animação.
 * Como o backend ainda não está implementado, retorna valores padrão silenciosamente.
 */
export const silent500ConfigInterceptor: HttpInterceptorFn = (req, next) => {
  // Aplicar apenas para o endpoint de config-animacao
  if (req.url.includes('/api/config-animacao')) {
    return next(req).pipe(
      catchError((error: HttpErrorResponse) => {
        // Se for erro 500, retornar valores padrão silenciosamente
        if (error.status === 500) {
          // Para GET, retornar config padrão
          if (req.method === 'GET') {
            return of(new HttpResponse({
              status: 200,
              body: {
                animacaoAtivada: true,
                intervaloAnimacao: 30,
                duracaoAnimacao: 6,
                video1Url: null,
                video2Url: null
              }
            }));
          }
          // Para POST, retornar o body da requisição (config que foi enviada)
          if (req.method === 'POST') {
            return of(new HttpResponse({
              status: 200,
              body: req.body
            }));
          }
        }
        // Para outros erros, propagar normalmente
        throw error;
      })
    );
  }
  
  // Para outros endpoints, passar adiante normalmente
  return next(req);
};

