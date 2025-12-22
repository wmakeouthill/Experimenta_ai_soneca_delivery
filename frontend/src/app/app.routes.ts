import { Routes } from '@angular/router';
import { authGuard, adminGuard, operadorGuard, roleGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'politica-privacidade',
    loadComponent: () => import('./components/politica-privacidade/politica-privacidade.component').then(m => m.PoliticaPrivacidadeComponent)
  },
  {
    path: 'termos-uso',
    loadComponent: () => import('./components/politica-privacidade/politica-privacidade.component').then(m => m.PoliticaPrivacidadeComponent)
  },
  {
    path: 'delivery',
    loadComponent: () => import('./components/pedido-delivery/pedido-delivery.component').then(m => m.PedidoDeliveryComponent)
  },
  {
    path: '',
    loadComponent: () => import('./components/home/home.component').then(m => m.HomeComponent),
    canActivate: [authGuard]
  },
  {
    path: 'cardapio',
    loadComponent: () => import('./components/cardapio/cardapio.component').then(m => m.CardapioComponent),
    canActivate: [adminGuard]
  },
  {
    path: 'pedidos',
    loadComponent: () => import('./components/pedidos/pedidos.component').then(m => m.PedidosComponent),
    canActivate: [operadorGuard]
  },
  {
    path: 'sessoes',
    loadComponent: () => import('./components/sessoes/sessoes.component').then(m => m.SessoesComponent),
    canActivate: [adminGuard]
  },
  {
    path: 'historico-sessoes',
    loadComponent: () => import('./components/historico-sessoes/historico-sessoes.component').then(m => m.HistoricoSessoesComponent),
    canActivate: [adminGuard]
  },
  {
    path: 'gestao-caixa',
    loadComponent: () => import('./components/gestao-caixa/gestao-caixa.component').then(m => m.GestaoCaixaComponent),
    canActivate: [adminGuard]
  },
  {
    path: 'relatorios',
    loadComponent: () => import('./components/relatorios/relatorios.component').then(m => m.RelatoriosComponent),
    canActivate: [adminGuard]
  },
  {
    path: 'relatorio-financeiro',
    loadComponent: () => import('./components/relatorio-financeiro/relatorio-financeiro.component').then(m => m.RelatorioFinanceiroComponent),
    canActivate: [adminGuard]
  },
  {
    path: 'gestao-estoque',
    loadComponent: () => import('./components/gestao-estoque/gestao-estoque.component').then(m => m.GestaoEstoqueComponent),
    canActivate: [adminGuard]
  },
  {
    path: 'administracao',
    loadComponent: () => import('./components/administracao/administracao.component').then(m => m.AdministracaoComponent),
    canActivate: [adminGuard]
  },
  {
    path: 'gestao-motoboys',
    loadComponent: () => import('./components/gestao-motoboys/gestao-motoboys.component').then(m => m.GestaoMotoboysComponent),
    canActivate: [adminGuard]
  },
  {
    path: 'mesa/:token',
    loadComponent: () => import('./components/pedido-cliente-mesa/pedido-cliente-mesa.component').then(m => m.PedidoClienteMesaComponent)
  },
  {
    path: 'pedido-mesa/:token',
    loadComponent: () => import('./components/pedido-cliente-mesa/pedido-cliente-mesa.component').then(m => m.PedidoClienteMesaComponent)
  },
  {
    path: 'lobby-pedidos',
    loadComponent: () => import('./components/lobby-pedidos/lobby-pedidos.component').then(m => m.LobbyPedidosComponent),
    canActivate: [operadorGuard]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
