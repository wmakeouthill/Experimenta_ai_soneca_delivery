import { Chart, ChartConfiguration, ChartOptions, registerables, TooltipItem } from 'chart.js';

Chart.register(...registerables);

const palette = [
  '#08BDBD',
  '#F25F5C',
  '#FFE066',
  '#247BA0',
  '#70C1B3',
  '#5D3FD3',
  '#FF9F1C',
  '#2EC4B6',
  '#CBF3F0',
  '#FFBF69',
  '#1B998B',
  '#ED6A5A'
];

export const defaultChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        usePointStyle: true,
        color: '#d4d4d8'
      }
    },
    tooltip: {
      callbacks: {
        label: (context: TooltipItem<'line' | 'bar' | 'doughnut'>) => {
          const label = context.dataset.label ?? '';
          const parsed = context.parsed;
          let value: number;

          if (typeof parsed === 'object' && parsed !== null) {
            value = (parsed as any).y ?? (parsed as any).x ?? (parsed as any) ?? 0;
          } else {
            value = Number(parsed) || 0;
          }

          return `${label}: ${formatarValor(value)}`;
        }
      }
    }
  }
} satisfies Pick<ChartOptions, 'responsive' | 'maintainAspectRatio' | 'plugins'>;

export function corPorIndice(indice: number): string {
  return palette[indice % palette.length];
}

export function formatarValor(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 2
  });
}

export function renderizarChart(
  canvas: HTMLCanvasElement,
  configuracao: ChartConfiguration<any, any, any>,
  chartAtual: Chart | null
): Chart {
  chartAtual?.destroy();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new Chart(canvas, configuracao as any);
}

export function destruirChart(chart: Chart | null): void {
  chart?.destroy();
}

