import { Component, inject, PLATFORM_ID, OnInit, ChangeDetectionStrategy, ViewChild, ElementRef, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { useHistoricoSessoes } from './composables/use-historico-sessoes';
import { SessaoTrabalho, StatusSessao } from '../../services/sessao-trabalho.service';
import { MeioPagamento, Pedido } from '../../services/pedido.service';
import { FormatoUtil } from '../../utils/formato.util';
import { AuthService } from '../../services/auth.service';

/**
 * Componente de apresentação para histórico de sessões.
 * Responsabilidade única: exibir UI e delegar lógica para o composable.
 */
@Component({
  selector: 'app-historico-sessoes',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './historico-sessoes.component.html',
  styleUrl: './historico-sessoes.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HistoricoSessoesComponent implements OnInit {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly authService = inject(AuthService);

  readonly historicoComposable = useHistoricoSessoes();
  readonly StatusSessao = StatusSessao;
  readonly MeioPagamento = MeioPagamento;
  readonly isAdministrador = this.authService.isAdministrador;

  @ViewChild('pedidosSecao', { static: false }) pedidosSecaoRef?: ElementRef<HTMLElement>;

  // Modal de confirmação de exclusão
  readonly mostrarModalExclusao = signal(false);
  readonly pedidoParaExcluir = signal<Pedido | null>(null);
  readonly textoConfirmacao = signal('');
  readonly textoEsperado = 'Sim, desejo apagar o pedido.';

  // Expor propriedades do composable
  readonly sessoes = this.historicoComposable.sessoes;
  readonly sessaoSelecionada = this.historicoComposable.sessaoSelecionada;
  readonly pedidos = this.historicoComposable.pedidos;
  readonly estado = this.historicoComposable.estado;
  readonly erro = this.historicoComposable.erro;
  readonly estaCarregando = this.historicoComposable.estaCarregando;
  readonly temSessaoSelecionada = this.historicoComposable.temSessaoSelecionada;
  readonly temPedidos = this.historicoComposable.temPedidos;
  readonly resumoFaturamento = this.historicoComposable.resumoFaturamento;

  // Paginação e filtros
  readonly sessoesPaginadas = this.historicoComposable.sessoesPaginadas;
  readonly dataFiltroSessoes = this.historicoComposable.dataFiltroSessoes;
  readonly pedidosPaginados = this.historicoComposable.pedidosPaginados;
  readonly pesquisaPedidos = this.historicoComposable.pesquisaPedidos;

  ngOnInit(): void {
    if (this.isBrowser) {
      this.historicoComposable.carregarSessoes();
    }
  }

  selecionarSessao(sessao: SessaoTrabalho): void {
    this.historicoComposable.selecionarSessao(sessao);
  }

  limparSelecao(): void {
    this.historicoComposable.selecionarSessao(null);
  }

  recarregar(): void {
    this.historicoComposable.recarregar();
  }

  formatarData(data: string | undefined): string {
    if (!data) return '';
    // Extrai apenas a parte da data (YYYY-MM-DD) se vier com hora
    const dataParte = data.split('T')[0];
    const [ano, mes, dia] = dataParte.split('-');
    return `${dia}/${mes}/${ano}`;
  }

  formatarDataHora(data: string | undefined): string {
    if (!data) return '';
    return FormatoUtil.dataHora(data);
  }

  filtrarSessoesPorData(data: string | null): void {
    this.historicoComposable.filtrarSessoesPorData(data);
  }

  irParaPaginaSessoes(pagina: number): void {
    this.historicoComposable.irParaPaginaSessoes(pagina);
  }

  pesquisarPedidos(texto: string): void {
    this.historicoComposable.pesquisarPedidos(texto);
  }

  irParaPaginaPedidos(pagina: number): void {
    this.historicoComposable.irParaPaginaPedidos(pagina);
    
    if (this.isBrowser) {
      requestAnimationFrame(() => {
        if (this.pedidosSecaoRef?.nativeElement) {
          this.pedidosSecaoRef.nativeElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    }
  }

  gerarNumerosPaginaSessoes(): (number | string)[] {
    const total = this.sessoesPaginadas().totalPaginas;
    const atual = this.sessoesPaginadas().paginaAtual;
    return this.gerarNumerosPagina(total, atual);
  }

  gerarNumerosPaginaPedidos(): (number | string)[] {
    const total = this.pedidosPaginados().totalPaginas;
    const atual = this.pedidosPaginados().paginaAtual;
    return this.gerarNumerosPagina(total, atual);
  }

  private gerarNumerosPagina(total: number, atual: number): (number | string)[] {
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

  formatarMoeda(valor: number): string {
    return FormatoUtil.moeda(valor);
  }

  obterNomeMeioPagamento(meio: MeioPagamento): string {
    const nomes: Record<MeioPagamento, string> = {
      [MeioPagamento.PIX]: 'PIX',
      [MeioPagamento.CARTAO_CREDITO]: 'Cartão de Crédito',
      [MeioPagamento.CARTAO_DEBITO]: 'Cartão de Débito',
      [MeioPagamento.VALE_REFEICAO]: 'Vale Refeição',
      [MeioPagamento.DINHEIRO]: 'Dinheiro'
    };
    return nomes[meio] || meio;
  }

  truncarNomeCliente(nomeCompleto: string): string {
    const palavras = nomeCompleto.trim().split(/\s+/);
    if (palavras.length <= 3) {
      return nomeCompleto;
    }
    return palavras.slice(0, 3).join(' ') + '...';
  }

  abrirModalConfirmacaoExclusao(pedido: Pedido): void {
    this.pedidoParaExcluir.set(pedido);
    this.textoConfirmacao.set('');
    this.mostrarModalExclusao.set(true);
  }

  fecharModalExclusao(): void {
    this.mostrarModalExclusao.set(false);
    this.pedidoParaExcluir.set(null);
    this.textoConfirmacao.set('');
  }

  podeConfirmarExclusao(): boolean {
    return this.textoConfirmacao().trim() === this.textoEsperado;
  }

  confirmarExclusao(): void {
    const pedido = this.pedidoParaExcluir();
    if (!pedido || !this.podeConfirmarExclusao()) {
      return;
    }

    this.historicoComposable.excluirPedido(pedido.id);
    this.fecharModalExclusao();
  }
}

