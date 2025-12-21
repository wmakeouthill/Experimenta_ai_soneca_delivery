export type Role = 'ADMINISTRADOR' | 'OPERADOR';

export interface Modulo {
  id: string;
  nome: string;
  descricao: string;
  icone: string;
  rota: string;
  cor: 'primary' | 'success' | 'warning' | 'info' | 'secondary' | 'purple' | 'orange';
  disponivel: boolean;
  rolesPermitidos: Role[];
  bloqueado: boolean;
}

