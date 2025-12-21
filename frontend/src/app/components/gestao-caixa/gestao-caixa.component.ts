import { Component, inject, PLATFORM_ID, OnInit, ChangeDetectionStrategy, signal, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { useGestaoCaixa } from './composables/use-gestao-caixa';
import { useSugestoesDescricao } from './composables/use-sugestoes-descricao';
import { useEstatisticasCaixa } from './composables/use-estatisticas-caixa';
import { useUsuarios } from '../sessoes/composables/use-usuarios';
import { SessaoTrabalho, StatusSessao } from '../../services/sessao-trabalho.service';
import { TipoItemCaixa } from '../../services/gestao-caixa.service';
import { FormatoUtil } from '../../utils/formato.util';

@Component({
  selector: 'app-gestao-caixa',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './gestao-caixa.component.html',
  styleUrl: './gestao-caixa.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GestaoCaixaComponent implements OnInit {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  readonly caixaComposable = useGestaoCaixa();
  readonly sugestoesComposable = useSugestoesDescricao();
  readonly estatisticasComposable = useEstatisticasCaixa();
  private readonly usuariosStore = useUsuarios();
  readonly StatusSessao = StatusSessao;
  readonly TipoItemCaixa = TipoItemCaixa;

  @ViewChild('tabelaCaixa', { static: false }) tabelaCaixaRef?: ElementRef<HTMLElement>;
  @ViewChild('descricaoDropdown', { static: false }) descricaoDropdownRef?: ElementRef<HTMLElement>;

  // Modal de movimentação
  readonly mostrarModalMovimentacao = signal(false);
  readonly tipoMovimentacao = signal<'sangria' | 'suprimento'>('sangria');
  readonly valorMovimentacao = signal<number | null>(null);
  readonly descricaoMovimentacao = signal('');

  // Expor propriedades do composable
  readonly sessoes = this.caixaComposable.sessoes;
  readonly sessaoSelecionada = this.caixaComposable.sessaoSelecionada;
  readonly resumoCaixa = this.caixaComposable.resumoCaixa;
  readonly estado = this.caixaComposable.estado;
  readonly erro = this.caixaComposable.erro;
  readonly estaCarregando = this.caixaComposable.estaCarregando;
  readonly temSessaoSelecionada = this.caixaComposable.temSessaoSelecionada;
  readonly itensPaginados = this.caixaComposable.itensPaginados;

  ngOnInit(): void {
    if (this.isBrowser) {
      this.caixaComposable.carregarSessoes();
      this.usuariosStore.carregarUsuarios();
      this.sugestoesComposable.carregarDescricoes();
    }
  }

  /**
   * Fecha o dropdown ao clicar fora.
   */
  @HostListener('document:mousedown', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.mostrarModalMovimentacao()) return;
    if (!this.sugestoesComposable.mostrarSugestoes()) return;

    const target = event.target as HTMLElement;
    const dropdown = this.descricaoDropdownRef?.nativeElement;

    if (dropdown && !dropdown.contains(target)) {
      this.sugestoesComposable.fecharSugestoes();
    }
  }

  /**
   * Obtém o nome do usuário pelo ID.
   */
  obterNomeUsuario(usuarioId: string | undefined): string {
    if (!usuarioId) return 'Desconhecido';
    return this.usuariosStore.obterNomeUsuario(usuarioId);
  }

  selecionarSessao(sessao: SessaoTrabalho): void {
    this.caixaComposable.selecionarSessao(sessao);
  }

  limparSelecao(): void {
    this.caixaComposable.selecionarSessao(null);
  }

  recarregar(): void {
    this.caixaComposable.recarregar();
  }

  formatarMoeda(valor: number | null | undefined): string {
    if (valor === null || valor === undefined) return 'R$ 0,00';
    return FormatoUtil.moeda(valor);
  }

  formatarDataHora(data: string | undefined): string {
    if (!data) return '';
    return FormatoUtil.dataHora(data);
  }

  formatarData(data: string | undefined): string {
    if (!data) return '';
    const dataParte = data.split('T')[0];
    const [ano, mes, dia] = dataParte.split('-');
    return `${dia}/${mes}/${ano}`;
  }

  obterClasseTipo(tipo: TipoItemCaixa): string {
    switch (tipo) {
      case TipoItemCaixa.VENDA_DINHEIRO:
        return 'tipo-venda';
      case TipoItemCaixa.SANGRIA:
        return 'tipo-sangria';
      case TipoItemCaixa.SUPRIMENTO:
        return 'tipo-suprimento';
      default:
        return '';
    }
  }

  abrirModalSangria(): void {
    this.tipoMovimentacao.set('sangria');
    this.valorMovimentacao.set(null);
    this.descricaoMovimentacao.set('');
    this.sugestoesComposable.resetar();
    this.mostrarModalMovimentacao.set(true);
  }

  abrirModalSuprimento(): void {
    this.tipoMovimentacao.set('suprimento');
    this.valorMovimentacao.set(null);
    this.descricaoMovimentacao.set('');
    this.sugestoesComposable.resetar();
    this.mostrarModalMovimentacao.set(true);
  }

  fecharModalMovimentacao(): void {
    this.mostrarModalMovimentacao.set(false);
    this.valorMovimentacao.set(null);
    this.descricaoMovimentacao.set('');
    this.sugestoesComposable.resetar();
  }

  confirmarMovimentacao(): void {
    const valor = this.valorMovimentacao();
    const descricao = this.descricaoMovimentacao().trim();

    if (!valor || valor <= 0 || !descricao) return;

    // Adiciona descrição à lista local se for nova
    this.sugestoesComposable.adicionarDescricaoLocal(descricao);

    if (this.tipoMovimentacao() === 'sangria') {
      this.caixaComposable.registrarSangria(valor, descricao);
    } else {
      this.caixaComposable.registrarSuprimento(valor, descricao);
    }

    this.fecharModalMovimentacao();
  }

  /**
   * Verifica se o formulário de movimentação é válido.
   */
  formularioMovimentacaoValido(): boolean {
    const valor = this.valorMovimentacao();
    const descricao = this.descricaoMovimentacao().trim();
    return !!valor && valor > 0 && !!descricao;
  }

  /**
   * Atualiza a descrição e filtra sugestões.
   */
  onDescricaoInput(valor: string): void {
    this.descricaoMovimentacao.set(valor);
    this.sugestoesComposable.buscar(valor);
    this.sugestoesComposable.abrirSugestoes();
  }

  /**
   * Seleciona uma sugestão de descrição.
   */
  selecionarSugestao(descricao: string): void {
    this.descricaoMovimentacao.set(descricao);
    this.sugestoesComposable.fecharSugestoes();
  }

  /**
   * Abre o dropdown de sugestões no foco do input.
   */
  onDescricaoFocus(): void {
    this.sugestoesComposable.abrirSugestoes();
  }

  /**
   * Alterna a exibição do dropdown de sugestões.
   */
  toggleSugestoes(): void {
    if (this.sugestoesComposable.mostrarSugestoes()) {
      this.sugestoesComposable.fecharSugestoes();
    } else {
      this.sugestoesComposable.abrirSugestoes();
    }
  }

  sessaoEstaAberta(): boolean {
    const sessao = this.sessaoSelecionada();
    return sessao?.status === StatusSessao.ABERTA || sessao?.status === StatusSessao.PAUSADA;
  }

  /**
   * Calcula o total em dinheiro (vendas + suprimentos - sangrias).
   */
  calcularTotalDinheiro(): number {
    const resumo = this.resumoCaixa();
    if (!resumo) return 0;

    const vendas = resumo.totalVendasDinheiro || 0;
    const suprimentos = resumo.totalSuprimentos || 0;
    const sangrias = resumo.totalSangrias || 0;

    return vendas + suprimentos - sangrias;
  }

  /**
   * Calcula o saldo esperado (abertura + vendas + suprimentos - sangrias).
   */
  calcularSaldoEsperado(): number {
    const resumo = this.resumoCaixa();
    if (!resumo) return 0;

    const abertura = resumo.valorAbertura || 0;
    const vendas = resumo.totalVendasDinheiro || 0;
    const suprimentos = resumo.totalSuprimentos || 0;
    const sangrias = resumo.totalSangrias || 0;

    return abertura + vendas + suprimentos - sangrias;
  }

  /**
   * Calcula a diferença da sessão atual (fechamento - saldo esperado).
   */
  calcularDiferencaAtual(): number {
    const resumo = this.resumoCaixa();
    if (!resumo || resumo.valorFechamento === null || resumo.valorFechamento === undefined) {
      return 0;
    }

    const saldoEsperado = this.calcularSaldoEsperado();
    return resumo.valorFechamento - saldoEsperado;
  }

  /**
   * Formata moeda com sinal (+/-).
   */
  formatarMoedaComSinal(valor: number | null | undefined): string {
    if (valor === null || valor === undefined) {
      return '-';
    }

    const sinal = valor >= 0 ? '+' : '';
    return sinal + this.formatarMoeda(valor);
  }

  irParaPagina(pagina: number): void {
    this.caixaComposable.irParaPagina(pagina);

    if (this.isBrowser) {
      requestAnimationFrame(() => {
        if (this.tabelaCaixaRef?.nativeElement) {
          this.tabelaCaixaRef.nativeElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      });
    }
  }

  gerarNumerosPagina(): (number | string)[] {
    const total = this.itensPaginados().totalPaginas;
    const atual = this.itensPaginados().paginaAtual;
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
