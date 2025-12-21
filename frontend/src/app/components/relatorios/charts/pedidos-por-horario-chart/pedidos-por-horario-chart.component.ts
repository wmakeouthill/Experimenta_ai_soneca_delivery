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
import { PedidosPorHorario } from '../../../../models/relatorios.model';
import {
  corPorIndice,
  defaultChartOptions,
  destruirChart,
  formatarValor,
  renderizarChart
} from '../../../../utils/chart.util';

@Component({
  selector: 'app-pedidos-por-horario-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pedidos-por-horario-chart.component.html',
  styleUrl: './pedidos-por-horario-chart.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PedidosPorHorarioChartComponent {
  private readonly destroyRef = inject(DestroyRef);

  readonly dados = input.required<PedidosPorHorario[]>();

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

  private montarConfiguracao(dados: PedidosPorHorario[]): ChartConfiguration<'bar'> {
    const labels = dados.map(item => item.horaReferencia);
    const valores = dados.map(item => item.quantidadePedidos);

    const options: ChartOptions<'bar'> = {
      ...defaultChartOptions,
      plugins: {
        ...defaultChartOptions.plugins,
        legend: { display: false },
        tooltip: {
          ...defaultChartOptions.plugins?.tooltip,
          callbacks: {
            label: (context) => {
              const parsed = context.parsed;
              const quantidade = typeof parsed === 'object' && parsed !== null
                ? (parsed as any).y ?? (parsed as any)
                : parsed;
              const indice = context.dataIndex;
              const valorTotal = dados[indice]?.valorTotal ?? 0;
              return [
                `Pedidos: ${Number(quantidade).toLocaleString('pt-BR')}`,
                `Faturamento: ${formatarValor(valorTotal)}`
              ];
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
            stepSize: 1,
            callback: (valor) => Number(valor).toLocaleString('pt-BR')
          },
          grid: { color: 'rgba(255,255,255,0.05)' }
        }
      }
    };

    return {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Pedidos por horário',
            data: valores,
            backgroundColor: corPorIndice(3),
            borderColor: corPorIndice(3),
            borderWidth: 1
          }
        ]
      },
      options
    };
  }
}

