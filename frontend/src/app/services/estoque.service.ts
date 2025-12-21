import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export type UnidadeMedida = 'UN' | 'KG' | 'G' | 'LT' | 'ML' | 'PCT' | 'CX';

export interface ItemEstoque {
  id: string;
  nome: string;
  descricao: string | null;
  quantidade: number;
  quantidadeMinima: number;
  unidadeMedida: UnidadeMedida;
  unidadeMedidaDescricao: string;
  precoUnitario: number | null;
  fornecedor: string | null;
  codigoBarras: string | null;
  ativo: boolean;
  estoqueBaixo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface CriarItemEstoqueRequest {
  nome: string;
  descricao?: string;
  quantidade?: number;
  quantidadeMinima?: number;
  unidadeMedida: UnidadeMedida;
  precoUnitario?: number;
  fornecedor?: string;
  codigoBarras?: string;
}

export interface AtualizarItemEstoqueRequest {
  nome: string;
  descricao?: string;
  quantidade?: number;
  quantidadeMinima?: number;
  unidadeMedida: UnidadeMedida;
  precoUnitario?: number;
  fornecedor?: string;
  codigoBarras?: string;
  ativo: boolean;
}

export interface ListarEstoqueParams {
  page?: number;
  size?: number;
  sort?: string;
  direction?: 'asc' | 'desc';
  filtro?: string;
  apenasAtivos?: boolean;
}

export const UNIDADES_MEDIDA: { value: UnidadeMedida; label: string }[] = [
  { value: 'UN', label: 'Unidade' },
  { value: 'KG', label: 'Quilograma' },
  { value: 'G', label: 'Grama' },
  { value: 'LT', label: 'Litro' },
  { value: 'ML', label: 'Mililitro' },
  { value: 'PCT', label: 'Pacote' },
  { value: 'CX', label: 'Caixa' }
];

@Injectable({
  providedIn: 'root'
})
export class EstoqueService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/estoque';

  /**
   * Lista itens de estoque com paginação.
   */
  listar(params: ListarEstoqueParams = {}): Observable<PageResponse<ItemEstoque>> {
    let httpParams = new HttpParams();
    
    if (params.page !== undefined) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params.size !== undefined) {
      httpParams = httpParams.set('size', params.size.toString());
    }
    if (params.sort) {
      httpParams = httpParams.set('sort', params.sort);
    }
    if (params.direction) {
      httpParams = httpParams.set('direction', params.direction);
    }
    if (params.filtro) {
      httpParams = httpParams.set('filtro', params.filtro);
    }
    if (params.apenasAtivos !== undefined) {
      httpParams = httpParams.set('apenasAtivos', params.apenasAtivos.toString());
    }
    
    return this.http.get<PageResponse<ItemEstoque>>(this.apiUrl, { params: httpParams });
  }

  /**
   * Cria um novo item de estoque.
   */
  criar(request: CriarItemEstoqueRequest): Observable<ItemEstoque> {
    return this.http.post<ItemEstoque>(this.apiUrl, request);
  }

  /**
   * Atualiza um item de estoque existente.
   */
  atualizar(id: string, request: AtualizarItemEstoqueRequest): Observable<ItemEstoque> {
    return this.http.put<ItemEstoque>(`${this.apiUrl}/${id}`, request);
  }

  /**
   * Exclui um item de estoque.
   */
  excluir(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

