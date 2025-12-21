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
import { DistribuicaoHoraria } from '../../../../models/relatorios.model';
import {
  corPorIndice,
  defaultChartOptions,
  destruirChart,
  formatarValor,
  renderizarChart
} from '../../../../utils/chart.util';

@Component({
  selector: 'app-vendas-por-horario-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vendas-por-horario-chart.component.html',
  styleUrl: './vendas-por-horario-chart.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VendasPorHorarioChartComponent {
  private readonly destroyRef = inject(DestroyRef);

  readonly dados = input.required<DistribuicaoHoraria[]>();

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

  private montarConfiguracao(dados: DistribuicaoHoraria[]): ChartConfiguration<'line'> {
    const labels = dados.map(item => item.horaReferencia);
    const valores = dados.map(item => item.valorTotal);

    const options: ChartOptions<'line'> = {
      ...defaultChartOptions,
      plugins: {
        ...defaultChartOptions.plugins,
        legend: { display: false },
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
      },
      scales: {
        x: {
          type: 'category',
          ticks: { color: '#d4d4d8' },
          grid: { color: 'rgba(255,255,255,0.08)' }
        },
        y: {
          type: 'linear',
          beginAtZero: true,
          ticks: {
            color: '#a1a1aa',
            callback: (valor) => formatarValor(Number(valor))
          },
          grid: { color: 'rgba(255,255,255,0.05)' }
        }
      }
    };

    return {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Faturamento por horário',
            data: valores,
            borderColor: corPorIndice(2),
            backgroundColor: 'transparent',
            fill: true,
            tension: 0.35
          }
        ]
      },
      options
    };
  }
}

