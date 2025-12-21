import { Injectable, inject, computed } from '@angular/core';
import { AuthService } from './auth.service';

export type Role = 'ADMINISTRADOR' | 'OPERADOR';

export interface PermissaoModulo {
  id: string;
  rolesPermitidos: Role[];
  requerAutenticacao: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthorizationService {
  private readonly authService = inject(AuthService);

  readonly permissoesModulos = computed<Map<string, PermissaoModulo>>(() => {
    const permissoes = new Map<string, PermissaoModulo>();

    permissoes.set('cardapio', {
      id: 'cardapio',
      rolesPermitidos: ['ADMINISTRADOR'],
      requerAutenticacao: true
    });

    permissoes.set('lobby-pedidos', {
      id: 'lobby-pedidos',
      rolesPermitidos: ['ADMINISTRADOR', 'OPERADOR'],
      requerAutenticacao: true
    });

    permissoes.set('pedidos', {
      id: 'pedidos',
      rolesPermitidos: ['ADMINISTRADOR', 'OPERADOR'],
      requerAutenticacao: true
    });

    permissoes.set('fila-pedidos-mesa', {
      id: 'fila-pedidos-mesa',
      rolesPermitidos: ['ADMINISTRADOR', 'OPERADOR'],
      requerAutenticacao: true
    });

    permissoes.set('sessoes', {
      id: 'sessoes',
      rolesPermitidos: ['ADMINISTRADOR'],
      requerAutenticacao: true
    });

    permissoes.set('historico-sessoes', {
      id: 'historico-sessoes',
      rolesPermitidos: ['ADMINISTRADOR'],
      requerAutenticacao: true
    });

    permissoes.set('gestao-caixa', {
      id: 'gestao-caixa',
      rolesPermitidos: ['ADMINISTRADOR'],
      requerAutenticacao: true
    });

    permissoes.set('relatorios', {
      id: 'relatorios',
      rolesPermitidos: ['ADMINISTRADOR'],
      requerAutenticacao: true
    });

    permissoes.set('relatorio-financeiro', {
      id: 'relatorio-financeiro',
      rolesPermitidos: ['ADMINISTRADOR'],
      requerAutenticacao: true
    });

    permissoes.set('gestao-estoque', {
      id: 'gestao-estoque',
      rolesPermitidos: ['ADMINISTRADOR'],
      requerAutenticacao: true
    });

    permissoes.set('administracao', {
      id: 'administracao',
      rolesPermitidos: ['ADMINISTRADOR'],
      requerAutenticacao: true
    });

    return permissoes;
  });

  podeAcessarModulo(idModulo: string): boolean {
    if (!this.authService.estaAutenticado()) {
      return false;
    }

    const permissao = this.permissoesModulos().get(idModulo);
    if (!permissao) {
      return false;
    }

    const roleAtual = this.authService.getRoleAtual();
    if (!roleAtual) {
      return false;
    }

    return permissao.rolesPermitidos.includes(roleAtual as Role);
  }

  getRolesPermitidos(idModulo: string): Role[] {
    return this.permissoesModulos().get(idModulo)?.rolesPermitidos ?? [];
  }

  requerAdministrador(idModulo: string): boolean {
    const permissao = this.permissoesModulos().get(idModulo);
    if (!permissao) {
      return false;
    }
    return permissao.rolesPermitidos.length === 1 &&
      permissao.rolesPermitidos[0] === 'ADMINISTRADOR';
  }
}

