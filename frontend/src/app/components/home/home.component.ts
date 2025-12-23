import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AuthorizationService } from '../../services/authorization.service';
import { Modulo } from '../../models/modulo.model';
import { FormatoUtil } from '../../utils/formato.util';
import { TituloHomeComponent } from './components/titulo-home/titulo-home.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, TituloHomeComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly authorizationService = inject(AuthorizationService);

  readonly usuarioAtual = this.authService.usuarioAtual;
  readonly estaAutenticado = this.authService.estaAutenticado;
  readonly isAdministrador = this.authService.isAdministrador;

  readonly nomeFormatado = computed(() => {
    const nome = this.usuarioAtual()?.nome;
    return FormatoUtil.capitalizarNome(nome);
  });

  readonly modulosDisponiveis = computed(() => {
    const modulosBase: Omit<Modulo, 'rolesPermitidos' | 'bloqueado'>[] = [
      {
        id: 'cardapio',
        nome: 'Gestão de Cardápio',
        descricao: 'Gerenciar produtos, categorias e itens do cardápio',
        icone: '🍔',
        rota: '/cardapio',
        cor: 'primary',
        disponivel: true
      },
      {
        id: 'pedidos',
        nome: 'Gestão de Pedidos',
        descricao: 'Gerenciar pedidos, fila de preparo e status',
        icone: '📋',
        rota: '/pedidos',
        cor: 'success',
        disponivel: true
      },
      {
        id: 'gestao-motoboys-kanban',
        nome: 'Gestão de Motoboys',
        descricao: 'Visualizar entregas por motoboy em formato kanban',
        icone: '🛵',
        rota: '/gestao-motoboys-kanban',
        cor: 'info',
        disponivel: true
      },
      {
        id: 'sessoes',
        nome: 'Gestão de Sessões',
        descricao: 'Gerenciar sessões de trabalho, iniciar, pausar e finalizar',
        icone: '📅',
        rota: '/sessoes',
        cor: 'info',
        disponivel: true
      },
      {
        id: 'gestao-caixa',
        nome: 'Gestão de Caixa',
        descricao: 'Controle financeiro de dinheiro por sessão de trabalho',
        icone: '💵',
        rota: '/gestao-caixa',
        cor: 'warning',
        disponivel: true
      },
      {
        id: 'relatorios',
        nome: 'Relatórios e Insights',
        descricao: 'Dashboards de vendas por período, categoria, cliente e horário',
        icone: '📈',
        rota: '/relatorios',
        cor: 'purple',
        disponivel: true
      },
      {
        id: 'gestao-estoque',
        nome: 'Gestão de Estoque',
        descricao: 'Controle de estoque e inventário de produtos',
        icone: '📦',
        rota: '/gestao-estoque',
        cor: 'success',
        disponivel: true
      },
      {
        id: 'administracao',
        nome: 'Administração',
        descricao: 'Gerenciar usuários, senhas e contas do sistema',
        icone: '⚙️',
        rota: '/administracao',
        cor: 'warning',
        disponivel: true
      }
    ];

    return modulosBase.map(modulo => {
      const podeAcessar = this.authorizationService.podeAcessarModulo(modulo.id);
      const rolesPermitidos = this.authorizationService.getRolesPermitidos(modulo.id);

      return {
        ...modulo,
        rolesPermitidos,
        bloqueado: !podeAcessar,
        disponivel: podeAcessar
      };
    });
  });

  navegarParaModulo(modulo: Modulo, event: MouseEvent): void {
    if (!modulo.disponivel || modulo.bloqueado) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    const url = this.router.serializeUrl(this.router.createUrlTree([modulo.rota]));
    const urlCompleta = window.location.origin + url;

    // Ctrl+Clique ou Clique com a rodinha → Abrir em nova guia
    if (event.ctrlKey || event.metaKey || event.button === 1) {
      event.preventDefault();
      window.open(urlCompleta, '_blank');
      return;
    }

    // Clique normal → Navegar na mesma página
    this.router.navigate([modulo.rota]);
  }

  logout(): void {
    this.authService.logout();
  }
}

