export type GranularidadeTempo = 'DIA' | 'SEMANA' | 'MES' | 'TRIMESTRE' | 'SEMESTRE' | 'ANO';

export interface FiltroRelatorioTemporal {
  granularidade: GranularidadeTempo;
  dataReferencia: string; // ISO date string (start of period)
  dataFim?: string; // optional explicit end
}

export interface EvolucaoVendasPonto {
  periodoId: string;
  label: string;
  totalVendas: number;
  totalPedidos: number;
  ticketMedio: number;
}

export interface CategoriaVendasResumo {
  categoriaId: string;
  categoriaNome: string;
  valorTotal: number;
  quantidadePedidos: number;
}

export interface QuantidadePorCategoria {
  categoriaId: string;
  categoriaNome: string;
  quantidadeVendida: number;
}

export interface ProdutoMaisVendido {
  produtoId: string;
  produtoNome: string;
  quantidadeVendida: number;
  valorTotal: number;
}

export interface DistribuicaoHoraria {
  horaReferencia: string;
  valorTotal: number;
  quantidadePedidos: number;
}

export interface PedidosPorHorario {
  horaReferencia: string;
  quantidadePedidos: number;
  valorTotal: number;
}

export interface DistribuicaoClientes {
  clienteId: string;
  clienteNome: string;
  valorTotal: number;
  quantidadePedidos: number;
}

export interface DistribuicaoMeioPagamento {
  meioPagamento: string;
  valorTotal: number;
  quantidadePedidos: number;
}

export interface IndicadoresResumo {
  totalFaturamento: number;
  totalPedidos: number;
  ticketMedio: number;
  crescimentoPercentual: number;
}

