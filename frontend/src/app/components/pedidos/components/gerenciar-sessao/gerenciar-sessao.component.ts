import { Component, ChangeDetectionStrategy, output, OnInit, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatusSessao } from '../../../../services/sessao-trabalho.service';
import { useSessaoAtiva } from './composables/use-sessao-ativa';
import { FormatoUtil } from '../../../../utils/formato.util';
import { AuthService } from '../../../../services/auth.service';

/**
 * Componente de apresentação para gerenciamento de sessão ativa.
 * Responsabilidade única: exibir UI e delegar lógica para o composable.
 */
@Component({
  selector: 'app-gerenciar-sessao',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gerenciar-sessao.component.html',
  styleUrl: './gerenciar-sessao.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GerenciarSessaoComponent implements OnInit {
  private readonly authService = inject(AuthService);

  readonly StatusSessao = StatusSessao;
  readonly onSessaoAlterada = output<void>();

  // Composable com toda a lógica de sessão
  readonly sessaoComposable = useSessaoAtiva();

  // Expor propriedades do composable
  readonly sessaoAtiva = this.sessaoComposable.sessaoAtiva;
  readonly carregando = this.sessaoComposable.carregando;
  readonly erro = this.sessaoComposable.erro;
  readonly temSessaoAtiva = this.sessaoComposable.temSessaoAtiva;
  readonly podePausar = this.sessaoComposable.podePausar;
  readonly podeRetomar = this.sessaoComposable.podeRetomar;
  readonly podeFinalizar = this.sessaoComposable.podeFinalizar;

  private ultimaSessaoId: string | null = null;

  constructor() {
    // Emitir evento quando sessão for alterada (apenas quando realmente mudar)
    effect(() => {
      const sessao = this.sessaoAtiva();
      const sessaoId = sessao?.id || null;

      // Emitir apenas se o ID da sessão mudou
      if (sessaoId !== this.ultimaSessaoId) {
        this.ultimaSessaoId = sessaoId;
        this.onSessaoAlterada.emit();
      }
    });
  }

  ngOnInit(): void {
    this.sessaoComposable.carregarSessaoAtiva();
  }

  iniciar(): void {
    const usuario = this.authService.usuarioAtual();
    if (!usuario) {
      alert('É necessário estar autenticado para iniciar uma sessão.');
      return;
    }
    this.sessaoComposable.iniciar(usuario.id);
  }

  pausar(): void {
    this.sessaoComposable.pausar();
  }

  retomar(): void {
    this.sessaoComposable.retomar();
  }

  finalizar(): void {
    if (!confirm('Tem certeza que deseja finalizar esta sessão? Todos os pedidos serão vinculados a esta sessão.')) {
      return;
    }
    this.sessaoComposable.finalizar();
  }

  formatarData(data: string): string {
    return FormatoUtil.dataHora(data);
  }
}

