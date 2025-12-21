import { Component, inject, PLATFORM_ID, OnInit, ChangeDetectionStrategy, computed, ViewChild, ElementRef, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { useSessoes } from './composables/use-sessoes';
import { useUsuarios } from './composables/use-usuarios';
import { SessaoTrabalhoService, SessaoTrabalho, StatusSessao } from '../../services/sessao-trabalho.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sessoes',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule
  ],
  templateUrl: './sessoes.component.html',
  styleUrl: './sessoes.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SessoesComponent implements OnInit {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly sessaoService = inject(SessaoTrabalhoService);
  private readonly authService = inject(AuthService);

  readonly sessoesComposable = useSessoes();
  readonly usuariosComposable = useUsuarios();

  readonly StatusSessao = StatusSessao;

  @ViewChild('sessoesSection', { static: false }) sessoesSectionRef?: ElementRef<HTMLElement>;

  // Modal de abertura de caixa
  readonly mostrarModalAbertura = signal(false);
  readonly valorAbertura = signal<number | null>(null);

  // Modal de fechamento de caixa
  readonly mostrarModalFechamento = signal(false);
  readonly valorFechamento = signal<number | null>(null);
  readonly sessaoParaFinalizar = signal<SessaoTrabalho | null>(null);

  readonly sessoesPaginadas = this.sessoesComposable.sessoesPaginadas;
  readonly estado = this.sessoesComposable.estado;
  readonly erro = this.sessoesComposable.erro;
  readonly estaCarregando = this.sessoesComposable.estaCarregando;
  readonly temSessoes = this.sessoesComposable.temSessoes;
  readonly pesquisaTexto = this.sessoesComposable.pesquisaTexto;
  readonly dataFiltro = this.sessoesComposable.dataFiltro;

  // Expor usuários para garantir reatividade
  readonly usuariosCarregando = this.usuariosComposable.carregando;
  readonly usuarios = this.usuariosComposable.usuarios;

  // Computed para mapear nomes de usuário - garante reatividade
  readonly nomesUsuarios = computed(() => {
    const map = new Map<string, string>();
    this.usuarios().forEach(usuario => {
      map.set(usuario.id, usuario.nome);
    });
    return map;
  });

  ngOnInit(): void {
    if (this.isBrowser) {
      this.usuariosComposable.carregarUsuarios();
      this.carregarDados();
    }
  }

  obterNomeUsuario(usuarioId: string): string {
    // Usar o computed reativo para garantir atualização
    const map = this.nomesUsuarios();
    return map.get(usuarioId) || usuarioId;
  }

  private carregarDados(): void {
    this.sessoesComposable.carregarSessoes();
  }

  filtrarPorData(data: string | null): void {
    this.sessoesComposable.filtrarPorData(data);
  }

  pesquisar(texto: string): void {
    this.sessoesComposable.pesquisar(texto);
  }

  limparFiltros(): void {
    this.sessoesComposable.limparFiltros();
  }

  recarregar(): void {
    this.carregarDados();
  }

  irParaPagina(pagina: number): void {
    this.sessoesComposable.irParaPagina(pagina);

    if (this.isBrowser) {
      requestAnimationFrame(() => {
        if (this.sessoesSectionRef?.nativeElement) {
          this.sessoesSectionRef.nativeElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    }
  }

  iniciarSessao(): void {
    const usuario = this.authService.usuarioAtual();
    if (!usuario) {
      if (this.isBrowser) {
        alert('É necessário estar autenticado para iniciar uma sessão.');
      }
      return;
    }

    // Abre o modal para informar o valor de abertura
    this.valorAbertura.set(0);
    this.mostrarModalAbertura.set(true);
  }

  fecharModalAbertura(): void {
    this.mostrarModalAbertura.set(false);
    this.valorAbertura.set(null);
  }

  confirmarAbertura(): void {
    const usuario = this.authService.usuarioAtual();
    const valor = this.valorAbertura();

    if (!usuario || valor === null || valor < 0) {
      return;
    }

    this.sessaoService.iniciar(usuario.id, valor).subscribe({
      next: () => {
        this.fecharModalAbertura();
        this.carregarDados();
      },
      error: (error) => {
        if (this.isBrowser) {
          alert(error.error?.message || 'Erro ao iniciar sessão');
        }
      }
    });
  }

  pausarSessao(sessao: SessaoTrabalho): void {
    this.sessaoService.pausar(sessao.id).subscribe({
      next: () => {
        this.carregarDados();
      },
      error: (error) => {
        if (this.isBrowser) {
          alert(error.error?.message || 'Erro ao pausar sessão');
        }
      }
    });
  }

  retomarSessao(sessao: SessaoTrabalho): void {
    this.sessaoService.retomar(sessao.id).subscribe({
      next: () => {
        this.carregarDados();
      },
      error: (error) => {
        if (this.isBrowser) {
          alert(error.error?.message || 'Erro ao retomar sessão');
        }
      }
    });
  }

  finalizarSessao(sessao: SessaoTrabalho): void {
    // Abre o modal para informar o valor de fechamento
    this.sessaoParaFinalizar.set(sessao);
    this.valorFechamento.set(null);
    this.mostrarModalFechamento.set(true);
  }

  fecharModalFechamento(): void {
    this.mostrarModalFechamento.set(false);
    this.valorFechamento.set(null);
    this.sessaoParaFinalizar.set(null);
  }

  confirmarFechamento(): void {
    const sessao = this.sessaoParaFinalizar();
    const valor = this.valorFechamento();

    if (!sessao || valor === null || valor < 0) {
      return;
    }

    this.sessaoService.finalizar(sessao.id, valor).subscribe({
      next: () => {
        this.fecharModalFechamento();
        this.carregarDados();
      },
      error: (error) => {
        if (this.isBrowser) {
          alert(error.error?.message || 'Erro ao finalizar sessão');
        }
      }
    });
  }

  formatarData(data: string): string {
    return new Date(data).toLocaleDateString('pt-BR');
  }

  formatarDataHora(data: string): string {
    return new Date(data).toLocaleString('pt-BR');
  }

  gerarNumerosPagina(): (number | string)[] {
    const total = this.sessoesPaginadas().totalPaginas;
    const atual = this.sessoesPaginadas().paginaAtual;
    const numeros: (number | string)[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) {
        numeros.push(i);
      }
    } else {
      numeros.push(1);

      if (atual > 3) {
        numeros.push('...');
      }

      const inicio = Math.max(2, atual - 1);
      const fim = Math.min(total - 1, atual + 1);

      for (let i = inicio; i <= fim; i++) {
        numeros.push(i);
      }

      if (atual < total - 2) {
        numeros.push('...');
      }

      if (total > 1) {
        numeros.push(total);
      }
    }

    return numeros;
  }
}

