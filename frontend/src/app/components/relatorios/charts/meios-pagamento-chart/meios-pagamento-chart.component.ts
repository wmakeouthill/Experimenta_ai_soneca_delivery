import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  ViewChild,
  effect,
  inject,
  input
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, ChartOptions } from 'chart.js';
import { DistribuicaoMeioPagamento } from '../../../../models/relatorios.model';
import {
  corPorIndice,
  defaultChartOptions,
  destruirChart,
  formatarValor,
  renderizarChart
} from '../../../../utils/chart.util';

@Component({
  selector: 'app-meios-pagamento-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './meios-pagamento-chart.component.html',
  styleUrl: './meios-pagamento-chart.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MeiosPagamentoChartComponent {
  private readonly destroyRef = inject(DestroyRef);

  readonly dados = input.required<DistribuicaoMeioPagamento[]>();

  @ViewChild('canvas')
  set canvasRef(elemento: ElementRef<HTMLCanvasElement> | undefined) {
    this.canvas = elemento;
    this.renderizar();
  }

  private canvas?: ElementRef<HTMLCanvasElement>;
  private chart: Chart | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => destruirChart(this.chart));

    effect(() => {
      this.dados();
      this.renderizar();
    });
  }

  private renderizar(): void {
    if (!this.canvas) {
      return;
    }

    const dados = this.dados();
    if (dados.length === 0) {
      destruirChart(this.chart);
      this.chart = null;
      return;
    }

    const configuracao = this.montarConfiguracao(dados);
    this.chart = renderizarChart(this.canvas.nativeElement, configuracao, this.chart);
  }

  private formatarMeioPagamento(meioPagamento: string): string {
    const mapeamento: Record<string, string> = {
      'CARTAO_CREDITO': 'Crédito',
      'PIX': 'Pix',
      'DINHEIRO': 'Dinheiro',
      'CARTAO_DEBITO': 'Débito',
      'VALE_REFEICAO': 'Voucher'
    };
    return mapeamento[meioPagamento] || meioPagamento;
  }

  private montarConfiguracao(dados: DistribuicaoMeioPagamento[]): ChartConfiguration<'doughnut'> {
    const labels = dados.map(item => this.formatarMeioPagamento(item.meioPagamento));
    const valores = dados.map(item => item.valorTotal);

    const options: ChartOptions<'doughnut'> = {
      ...defaultChartOptions,
      plugins: {
        ...defaultChartOptions.plugins,
        legend: {
          ...defaultChartOptions.plugins?.legend,
          position: 'right'
        },
        tooltip: {
          ...defaultChartOptions.plugins?.tooltip,
          callbacks: {
            label: (context) => {
              const valor = typeof context.parsed === 'object' && context.parsed !== null
                ? (context.parsed as any).y ?? (context.parsed as any)
                : context.parsed;
              return `Faturamento: ${formatarValor(Number(valor))}`;
            }
          }
        }
      }
    };

    return {
      type: 'doughnut',
      data: {
        labels,
        datasets: [
          {
            label: 'Faturamento',
            data: valores,
            backgroundColor: labels.map((_, indice) => corPorIndice(indice)),
            borderColor: '#1d1e2a'
          }
        ]
      },
      options
    };
  }
}

