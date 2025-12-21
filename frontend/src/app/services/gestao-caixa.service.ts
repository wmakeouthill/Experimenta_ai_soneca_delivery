import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export enum TipoItemCaixa {
  VENDA_DINHEIRO = 'VENDA_DINHEIRO',
  SANGRIA = 'SANGRIA',
  SUPRIMENTO = 'SUPRIMENTO',
  ABERTURA = 'ABERTURA',
  FECHAMENTO = 'FECHAMENTO'
}

export interface ItemCaixa {
  id: string;
  tipo: TipoItemCaixa;
  tipoDescricao: string;
  dataHora: string;
  numeroPedido?: number;
  clienteNome?: string;
  descricao?: string;
  usuarioId?: string;
  valor: number;
}

export interface ResumoCaixa {
  sessaoId: string;
  nomeSessao: string;
  valorAbertura: number;
  totalVendasDinheiro: number;
  quantidadeVendasDinheiro: number;
  totalSangrias: number;
  totalSuprimentos: number;
  saldoEsperado: number;
  valorFechamento?: number;
  diferenca?: number;
  diferencaGlobal?: number;
  diferencaSessaoAnterior?: number;
  nomeSessaoAnterior?: string;
  itensCaixa: ItemCaixa[];
  totalItens: number;
}

export interface RegistrarMovimentacaoRequest {
  valor: number;
  descricao?: string;
}

export interface DescricaoMovimentacao {
  descricao: string;
  quantidade: number;
}

export interface EstatisticaMovimentacao {
  descricao: string;
  quantidade: number;
  valorTotal: number;
}

export interface EstatisticasCaixa {
  sangrias: EstatisticaMovimentacao[];
  suprimentos: EstatisticaMovimentacao[];
}

@Injectable({
  providedIn: 'root'
})
export class GestaoCaixaService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/caixa';

  /**
   * Busca o resumo do caixa de uma sessão.
   */
  buscarResumo(sessaoId: string): Observable<ResumoCaixa> {
    return this.http.get<ResumoCaixa>(`${this.apiUrl}/sessao/${sessaoId}/resumo`);
  }

  /**
   * Registra uma sangria (retirada de dinheiro) no caixa.
   */
  registrarSangria(sessaoId: string, request: RegistrarMovimentacaoRequest): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/sessao/${sessaoId}/sangria`, request);
  }

  /**
   * Registra um suprimento (entrada de dinheiro) no caixa.
   */
  registrarSuprimento(sessaoId: string, request: RegistrarMovimentacaoRequest): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/sessao/${sessaoId}/suprimento`, request);
  }

  /**
   * Busca todas as descrições de movimentações anteriores (sangria/suprimento) com contagem.
   * Usado para autocomplete no campo de descrição, ordenado por frequência de uso.
   */
  buscarDescricoesMovimentacao(): Observable<DescricaoMovimentacao[]> {
    return this.http.get<DescricaoMovimentacao[]>(`${this.apiUrl}/descricoes-movimentacao`);
  }

  /**
   * Busca estatísticas de movimentações (sangrias e suprimentos).
   * Retorna as 20 descrições mais usadas para cada tipo.
   */
  buscarEstatisticas(): Observable<EstatisticasCaixa> {
    return this.http.get<EstatisticasCaixa>(`${this.apiUrl}/estatisticas`);
  }
}

