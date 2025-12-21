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
import { DistribuicaoClientes } from '../../../../models/relatorios.model';
import {
  corPorIndice,
  defaultChartOptions,
  destruirChart,
  formatarValor,
  renderizarChart
} from '../../../../utils/chart.util';

@Component({
  selector: 'app-vendas-por-cliente-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vendas-por-cliente-chart.component.html',
  styleUrl: './vendas-por-cliente-chart.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VendasPorClienteChartComponent {
  private readonly destroyRef = inject(DestroyRef);

  readonly dados = input.required<DistribuicaoClientes[]>();

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

  private limitarNome(nomeCompleto: string): string {
    const palavras = nomeCompleto.trim().split(/\s+/);
    return palavras.slice(0, 3).join(' ');
  }

  private montarConfiguracao(dados: DistribuicaoClientes[]): ChartConfiguration<'bar'> {
    const labels = dados.map(item => this.limitarNome(item.clienteNome));
    const valores = dados.map(item => item.valorTotal);

    const options: ChartOptions<'bar'> = {
      ...defaultChartOptions,
      indexAxis: 'y',
      plugins: {
        ...defaultChartOptions.plugins,
        tooltip: {
          ...defaultChartOptions.plugins?.tooltip,
          callbacks: {
            title: (context) => {
              const indice = context[0].dataIndex;
              return dados[indice]?.clienteNome || '';
            },
            label: (context) => {
              const valor = context.parsed.x ?? context.parsed;
              return `Faturamento: ${formatarValor(Number(valor))}`;
            }
          }
        }
      },
      scales: {
        x: {
          type: 'linear',
          beginAtZero: true,
          ticks: {
            color: '#d4d4d8',
            callback: (valor) => formatarValor(Number(valor))
          },
          grid: { color: 'rgba(255,255,255,0.08)' }
        },
        y: {
          type: 'category',
          ticks: { color: '#e2e8f0' },
          grid: { display: false }
        }
      }
    };

    return {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Faturamento',
            data: valores,
            borderRadius: 8,
            backgroundColor: labels.map((_, indice) => corPorIndice(indice))
          }
        ]
      },
      options
    };
  }
}

