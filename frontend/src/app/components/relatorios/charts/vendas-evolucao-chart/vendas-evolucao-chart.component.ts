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
import { EvolucaoVendasPonto } from '../../../../models/relatorios.model';
import {
  corPorIndice,
  defaultChartOptions,
  destruirChart,
  formatarValor,
  renderizarChart
} from '../../../../utils/chart.util';

@Component({
  selector: 'app-vendas-evolucao-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vendas-evolucao-chart.component.html',
  styleUrl: './vendas-evolucao-chart.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VendasEvolucaoChartComponent {
  private readonly destroyRef = inject(DestroyRef);

  readonly dados = input.required<EvolucaoVendasPonto[]>();

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

  private montarConfiguracao(dados: EvolucaoVendasPonto[]): ChartConfiguration<'line'> {
    const labels = dados.map(item => item.label);
    const faturamento = dados.map(item => item.totalVendas);
    const pedidos = dados.map(item => item.totalPedidos);

    const options: ChartOptions<'line'> = {
      ...defaultChartOptions,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        ...defaultChartOptions.plugins,
        tooltip: {
          ...defaultChartOptions.plugins?.tooltip,
          callbacks: {
            label: (context) => {
              const parsed = context.parsed;
              let value: number;

              if (typeof parsed === 'object' && parsed !== null) {
                value = (parsed as any).y ?? (parsed as any) ?? 0;
              } else {
                value = Number(parsed) || 0;
              }

              const label = context.dataset.label ?? '';
              if (context.datasetIndex === 0) {
                return `${label}: ${formatarValor(value)}`;
              } else {
                return `${label}: ${Number(value).toLocaleString('pt-BR')} pedidos`;
              }
            }
          }
        }
      },
      scales: {
        y: {
          type: 'linear',
          beginAtZero: true,
          ticks: {
            callback: (valor) => formatarValor(Number(valor)),
            color: '#a1a1aa'
          },
          grid: { color: 'rgba(255,255,255,0.05)' }
        },
        y1: {
          type: 'linear',
          position: 'right',
          beginAtZero: true,
          grid: { drawOnChartArea: false },
          ticks: { color: '#a1a1aa' }
        },
        x: {
          type: 'category',
          ticks: { color: '#d4d4d8' },
          grid: { color: 'rgba(255,255,255,0.08)' }
        }
      }
    };

    return {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Faturamento',
            data: faturamento,
            borderColor: corPorIndice(0),
            backgroundColor: corPorIndice(0),
            tension: 0.3,
            yAxisID: 'y'
          },
          {
            label: 'Pedidos',
            data: pedidos,
            borderColor: corPorIndice(1),
            backgroundColor: corPorIndice(1),
            tension: 0.3,
            borderDash: [6, 4],
            yAxisID: 'y1'
          }
        ]
      },
      options
    };
  }
}

