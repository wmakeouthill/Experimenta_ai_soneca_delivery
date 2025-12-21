import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { SessaoTrabalhoService } from '../services/sessao-trabalho.service';
import { catchError, map, of } from 'rxjs';

export const sessaoAtivaGuard: CanActivateFn = (route, state) => {
  // Guard permite acesso, mas o componente de pedidos verifica a sessão
  // e mostra o componente de gerenciar sessão que permite iniciar uma nova
  return true;
};

