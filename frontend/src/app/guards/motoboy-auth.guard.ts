import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { MotoboyAuthService } from '../services/motoboy-auth.service';

/**
 * Guard para proteger rotas que requerem autenticação de motoboy.
 * Redireciona para /cadastro-motoboy se não estiver autenticado.
 */
export const motoboyAuthGuard: CanActivateFn = (route, state) => {
  const motoboyAuthService = inject(MotoboyAuthService);
  const router = inject(Router);

  // Verifica autenticação de forma mais robusta
  // Em mobile, sessionStorage persiste durante a sessão do navegador
  const isAuthenticated = motoboyAuthService.isAuthenticated();
  
  if (!isAuthenticated) {
    console.warn('⚠️ Motoboy não autenticado. Redirecionando para login...', {
      temToken: !!motoboyAuthService.getToken(),
      temMotoboy: !!motoboyAuthService.motoboyLogado,
      url: state.url,
      sessionStorageDisponivel: typeof sessionStorage !== 'undefined'
    });
    
    // NÃO limpa a sessão aqui - pode ser que o sessionStorage ainda não foi carregado
    // O interceptor de erro vai limpar se necessário
    
    router.navigate(['/cadastro-motoboy'], { 
      queryParams: { returnUrl: state.url } 
    });
    return false;
  }

  console.debug('✅ Motoboy autenticado. Permitindo acesso a:', state.url);
  return true;
};

