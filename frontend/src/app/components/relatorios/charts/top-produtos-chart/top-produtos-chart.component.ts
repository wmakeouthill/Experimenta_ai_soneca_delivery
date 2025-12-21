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
import { ProdutoMaisVendido } from '../../../../models/relatorios.model';
import {
  defaultChartOptions,
  destruirChart,
  formatarValor,
  renderizarChart
} from '../../../../utils/chart.util';

@Component({
  selector: 'app-top-produtos-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './top-produtos-chart.component.html',
  styleUrl: './top-produtos-chart.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TopProdutosChartComponent {
  private readonly destroyRef = inject(DestroyRef);

  readonly dados = input.required<ProdutoMaisVendido[]>();

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

  private montarConfiguracao(dados: ProdutoMaisVendido[]): ChartConfiguration<'bar'> {
    const labels = dados.map(item => item.produtoNome);
    const valores = dados.map(item => item.valorTotal);
    const quantidades = dados.map(item => item.quantidadeVendida);

    const options: ChartOptions<'bar'> = {
      ...defaultChartOptions,
      plugins: {
        ...defaultChartOptions.plugins,
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            usePointStyle: true,
            color: '#d4d4d8',
            padding: 15
          }
        },
        tooltip: {
          ...defaultChartOptions.plugins?.tooltip,
          callbacks: {
            label: (context) => {
              const label = context.dataset.label ?? '';
              const value = context.parsed.y ?? context.parsed;
              if (context.datasetIndex === 0) {
                return `${label}: ${formatarValor(Number(value))}`;
              } else {
                return `${label}: ${Number(value).toLocaleString('pt-BR')} unidades`;
              }
            }
          }
        }
      },
      scales: {
        x: {
          type: 'category',
          ticks: { color: '#d4d4d8', autoSkip: false },
          grid: { display: false }
        },
        y: {
          type: 'linear',
          beginAtZero: true,
          position: 'left',
          ticks: {
            color: '#a1a1aa',
            callback: (valor) => formatarValor(Number(valor))
          },
          grid: { color: 'rgba(255,255,255,0.08)' },
          title: {
            display: true,
            text: 'Valor (R$)',
            color: '#a1a1aa'
          }
        },
        y1: {
          type: 'linear',
          beginAtZero: true,
          position: 'right',
          ticks: {
            color: '#a1a1aa',
            precision: 0,
            callback: (valor) => Number(valor).toLocaleString('pt-BR')
          },
          grid: { display: false },
          title: {
            display: true,
            text: 'Quantidade',
            color: '#a1a1aa'
          }
        }
      }
    };

    return {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Valor financeiro',
            data: valores,
            backgroundColor: '#08BDBD',
            borderRadius: 6,
            yAxisID: 'y'
          },
          {
            label: 'Quantidade vendida',
            data: quantidades,
            backgroundColor: '#F25F5C',
            borderRadius: 6,
            yAxisID: 'y1'
          }
        ]
      },
      options
    };
  }
}

