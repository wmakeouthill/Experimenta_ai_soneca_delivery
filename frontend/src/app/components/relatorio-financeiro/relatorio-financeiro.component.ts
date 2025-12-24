import { ChangeDetectionStrategy, Component, computed, ViewChild, ElementRef, PLATFORM_ID, inject, OnInit } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { useRelatorioFinanceiro } from './composables/use-relatorio-financeiro';
import { useUsuarios } from '../sessoes/composables/use-usuarios';
import { FormatoUtil } from '../../utils/formato.util';
import { MeioPagamento, StatusPedido } from '../../services/pedido.service';
import { TooltipItensComponent } from './components/tooltip-itens/tooltip-itens.component';
import { TooltipMeiosPagamentoComponent } from './components/tooltip-meios-pagamento/tooltip-meios-pagamento.component';

@Component({
  selector: 'app-relatorio-financeiro',
  standalone: true,
  imports: [CommonModule, RouterModule, TooltipItensComponent, TooltipMeiosPagamentoComponent],
  templateUrl: './relatorio-financeiro.component.html',
  styleUrl: './relatorio-financeiro.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RelatorioFinanceiroComponent implements OnInit {
  private readonly store = useRelatorioFinanceiro();
  private readonly usuariosStore = useUsuarios();
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  @ViewChild('tabelaPedidos', { static: false }) tabelaPedidosRef?: ElementRef<HTMLElement>;

  readonly dataFiltro = this.store.dataFiltro;
  readonly estado = this.store.estado;
  readonly erro = this.store.erro;
  readonly pedidos = this.store.pedidosPaginados;
  readonly estaCarregando = this.store.estaCarregando;
  readonly possuiDados = this.store.possuiDados;
  readonly resumoFinanceiro = this.store.resumoFinanceiro;
  readonly resumoPorMeioPagamento = this.store.resumoPorMeioPagamento;

  readonly dataFiltroInput = computed(() => this.dataFiltro());

  readonly StatusPedido = StatusPedido;
  readonly MeioPagamento = MeioPagamento;

  ngOnInit(): void {
    if (this.isBrowser) {
      this.usuariosStore.carregarUsuarios();
    }
  }

  obterNomeUsuario(usuarioId: string | undefined): string {
    if (!usuarioId) return '-';
    return this.usuariosStore.obterNomeUsuario(usuarioId);
  }

  alterarData(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input?.value) {
      this.store.alterarData(input.value);
    }
  }

  recarregar(): void {
    this.store.carregarPedidos();
  }

  formatarMoeda(valor: number): string {
    return FormatoUtil.moeda(valor);
  }

  formatarData(data: string): string {
    return FormatoUtil.dataHora(data);
  }

  formatarStatus(status: StatusPedido): string {
    const statusMap: Record<StatusPedido, string> = {
      [StatusPedido.PENDENTE]: 'Pendente',
      [StatusPedido.PREPARANDO]: 'Preparando',
      [StatusPedido.PRONTO]: 'Pronto',
      [StatusPedido.SAIU_PARA_ENTREGA]: 'Saiu p/ Entrega',
      [StatusPedido.FINALIZADO]: 'Finalizado',
      [StatusPedido.CANCELADO]: 'Cancelado'
    };
    return statusMap[status] || status;
  }

  formatarMeioPagamento(meio: MeioPagamento): string {
    const nomes: Record<MeioPagamento, string> = {
      [MeioPagamento.PIX]: 'PIX',
      [MeioPagamento.CARTAO_CREDITO]: 'Cartão de Crédito',
      [MeioPagamento.CARTAO_DEBITO]: 'Cartão de Débito',
      [MeioPagamento.VALE_REFEICAO]: 'Vale Refeição',
      [MeioPagamento.DINHEIRO]: 'Dinheiro'
    };
    return nomes[meio] || meio;
  }

  obterClasseStatus(status: StatusPedido): string {
    const classes: Record<StatusPedido, string> = {
      [StatusPedido.PENDENTE]: 'status-pendente',
      [StatusPedido.PREPARANDO]: 'status-preparando',
      [StatusPedido.PRONTO]: 'status-pronto',
      [StatusPedido.SAIU_PARA_ENTREGA]: 'status-saiu-para-entrega',
      [StatusPedido.FINALIZADO]: 'status-finalizado',
      [StatusPedido.CANCELADO]: 'status-cancelado'
    };
    return classes[status] || '';
  }

  obterValorPorMeioPagamento(meioPagamento: MeioPagamento): number {
    const resumo = this.resumoPorMeioPagamento();
    const item = resumo.find(r => r.meioPagamento === meioPagamento);
    return item?.valorTotal || 0;
  }

  obterQuantidadePorMeioPagamento(meioPagamento: MeioPagamento): number {
    const resumo = this.resumoPorMeioPagamento();
    const item = resumo.find(r => r.meioPagamento === meioPagamento);
    return item?.quantidadePedidos || 0;
  }

  readonly metodosPagamentoOrdenados: MeioPagamento[] = [
    MeioPagamento.DINHEIRO,
    MeioPagamento.PIX,
    MeioPagamento.CARTAO_CREDITO,
    MeioPagamento.CARTAO_DEBITO,
    MeioPagamento.VALE_REFEICAO
  ];

  gerarNumerosPagina(): (number | string)[] {
    const total = this.pedidos().totalPaginas;
    const atual = this.pedidos().paginaAtual;
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

  irParaPagina(pagina: number): void {
    this.store.irParaPagina(pagina);

    if (this.isBrowser) {
      requestAnimationFrame(() => {
        if (this.tabelaPedidosRef?.nativeElement) {
          this.tabelaPedidosRef.nativeElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    }
  }
}

