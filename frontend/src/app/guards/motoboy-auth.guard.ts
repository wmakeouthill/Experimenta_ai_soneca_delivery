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

  if (motoboyAuthService.isAuthenticated()) {
    return true;
  }

  router.navigate(['/cadastro-motoboy'], { queryParams: { returnUrl: state.url } });
  return false;
};

