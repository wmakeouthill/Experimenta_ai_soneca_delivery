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
import { CategoriaVendasResumo } from '../../../../models/relatorios.model';
import {
  corPorIndice,
  defaultChartOptions,
  destruirChart,
  formatarValor,
  renderizarChart
} from '../../../../utils/chart.util';

@Component({
  selector: 'app-categorias-vendas-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './categorias-vendas-chart.component.html',
  styleUrl: './categorias-vendas-chart.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CategoriasVendasChartComponent {
  private readonly destroyRef = inject(DestroyRef);

  readonly dados = input.required<CategoriaVendasResumo[]>();

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

  private montarConfiguracao(dados: CategoriaVendasResumo[]): ChartConfiguration<'bar'> {
    const labels = dados.map(item => item.categoriaNome);
    const valores = dados.map(item => item.valorTotal);

    const options: ChartOptions<'bar'> = {
      ...defaultChartOptions,
      indexAxis: 'y',
      plugins: {
        ...defaultChartOptions.plugins,
        tooltip: {
          ...defaultChartOptions.plugins?.tooltip,
          callbacks: {
            label: (context) => {
              const valor = typeof context.parsed === 'object' && context.parsed !== null
                ? (context.parsed as any).x ?? (context.parsed as any)
                : context.parsed;
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

