import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { useRelatorios } from './composables/use-relatorios';
import { GranularidadeTempo } from '../../models/relatorios.model';
import { VendasEvolucaoChartComponent } from './charts/vendas-evolucao-chart/vendas-evolucao-chart.component';
import { CategoriasVendasChartComponent } from './charts/categorias-vendas-chart/categorias-vendas-chart.component';
import { TopProdutosChartComponent } from './charts/top-produtos-chart/top-produtos-chart.component';
import { VendasPorHorarioChartComponent } from './charts/vendas-por-horario-chart/vendas-por-horario-chart.component';
import { PedidosPorHorarioChartComponent } from './charts/pedidos-por-horario-chart/pedidos-por-horario-chart.component';
import { QuantidadePorCategoriaChartComponent } from './charts/quantidade-por-categoria-chart/quantidade-por-categoria-chart.component';
import { VendasPorClienteChartComponent } from './charts/vendas-por-cliente-chart/vendas-por-cliente-chart.component';
import { MeiosPagamentoChartComponent } from './charts/meios-pagamento-chart/meios-pagamento-chart.component';

interface GranularidadeOption {
  id: GranularidadeTempo;
  label: string;
  descricao: string;
}

@Component({
  selector: 'app-relatorios',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    VendasEvolucaoChartComponent,
    CategoriasVendasChartComponent,
    TopProdutosChartComponent,
    QuantidadePorCategoriaChartComponent,
    VendasPorHorarioChartComponent,
    PedidosPorHorarioChartComponent,
    VendasPorClienteChartComponent,
    MeiosPagamentoChartComponent
  ],
  templateUrl: './relatorios.component.html',
  styleUrl: './relatorios.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RelatoriosComponent {
  private readonly store = useRelatorios();

  readonly filtro = this.store.filtro;
  readonly estado = this.store.estado;
  readonly erro = this.store.erro;
  readonly evolucaoVendas = this.store.evolucaoVendas;
  readonly categorias = this.store.categorias;
  readonly quantidadePorCategoria = this.store.quantidadePorCategoria;
  readonly produtos = this.store.produtos;
  readonly horarios = this.store.horarios;
  readonly pedidosPorHorario = this.store.pedidosPorHorario;
  readonly clientes = this.store.clientes;
  readonly meiosPagamento = this.store.meiosPagamento;
  readonly indicadores = this.store.indicadores;
  readonly estaCarregando = this.store.estaCarregando;
  readonly possuiDados = this.store.possuiDados;

  readonly dataReferenciaInput = computed(() =>
    this.filtro().dataReferencia.slice(0, 10)
  );

  readonly dataFimInput = computed(() =>
    this.filtro().dataFim?.slice(0, 10) ?? ''
  );

  readonly mostrarDataFim = computed(() =>
    this.filtro().granularidade === 'DIA'
  );

  readonly granularidades: GranularidadeOption[] = [
    { id: 'DIA', label: 'Dia', descricao: 'Dados do dia selecionado (ou intervalo de datas)' },
    { id: 'SEMANA', label: 'Semana', descricao: 'Agrupa por semana no mês selecionado' },
    { id: 'MES', label: 'Mês', descricao: 'Visão mensal das sessões' },
    { id: 'TRIMESTRE', label: 'Trimestre', descricao: 'Comparação trimestral' },
    { id: 'SEMESTRE', label: 'Semestre', descricao: 'Consolidação semestral' },
    { id: 'ANO', label: 'Ano', descricao: 'Panorama anual' }
  ];

  alterarGranularidade(granularidade: GranularidadeTempo): void {
    this.store.alterarGranularidade(granularidade);
  }

  alterarData(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input?.value) {
      this.store.alterarDataReferencia(input.value);
    }
  }

  alterarDataFim(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.store.alterarDataFim(input?.value || null);
  }

  recarregar(): void {
    this.store.carregarRelatorios();
  }

  formatarMoeda(valor: number | null | undefined): string {
    return (valor ?? 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 2
    });
  }

  formatarNumero(valor: number | null | undefined): string {
    return (valor ?? 0).toLocaleString('pt-BR');
  }

  formatarPercentual(valor: number | null | undefined): string {
    const numero = valor ?? 0;
    return `${numero > 0 ? '+' : ''}${numero.toFixed(1)}%`;
  }
}

