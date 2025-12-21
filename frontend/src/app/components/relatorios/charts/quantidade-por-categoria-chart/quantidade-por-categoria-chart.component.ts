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
import { QuantidadePorCategoria } from '../../../../models/relatorios.model';
import {
  corPorIndice,
  defaultChartOptions,
  destruirChart,
  renderizarChart
} from '../../../../utils/chart.util';

@Component({
  selector: 'app-quantidade-por-categoria-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './quantidade-por-categoria-chart.component.html',
  styleUrl: './quantidade-por-categoria-chart.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QuantidadePorCategoriaChartComponent {
  private readonly destroyRef = inject(DestroyRef);

  readonly dados = input.required<QuantidadePorCategoria[]>();

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

  private montarConfiguracao(dados: QuantidadePorCategoria[]): ChartConfiguration<'bar'> {
    const labels = dados.map(item => item.categoriaNome);
    const valores = dados.map(item => item.quantidadeVendida);

    const options: ChartOptions<'bar'> = {
      ...defaultChartOptions,
      indexAxis: 'y',
      plugins: {
        ...defaultChartOptions.plugins,
        tooltip: {
          ...defaultChartOptions.plugins?.tooltip,
          callbacks: {
            label: (context) => {
              const valor = context.parsed.x ?? context.parsed;
              return `Quantidade: ${Number(valor).toLocaleString('pt-BR')}`;
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
            stepSize: 1,
            callback: (valor) => Number(valor).toLocaleString('pt-BR')
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
            label: 'Quantidade vendida',
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

