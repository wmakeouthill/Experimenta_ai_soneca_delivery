import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Produto {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  categoria: string;
  disponivel: boolean;
  foto?: string; // Base64 string da imagem
  createdAt: string;
  updatedAt: string;
}

export interface CriarProdutoRequest {
  nome: string;
  descricao?: string;
  preco: number;
  categoria: string;
  foto?: string; // Base64 string da imagem
}

export interface AtualizarProdutoRequest {
  nome?: string;
  descricao?: string;
  preco?: number;
  categoria?: string;
  disponivel?: boolean;
  foto?: string; // Base64 string da imagem
}

export interface ProdutoFilters {
  categoria?: string;
  disponivel?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ProdutoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/produtos';

  listar(filters?: ProdutoFilters): Observable<Produto[]> {
    let params = new HttpParams();
    
    if (filters?.categoria) {
      params = params.set('categoria', filters.categoria);
    }
    
    if (filters?.disponivel !== undefined) {
      params = params.set('disponivel', filters.disponivel);
    }
    
    return this.http.get<Produto[]>(this.apiUrl, { params });
  }

  buscarPorId(id: string): Observable<Produto> {
    return this.http.get<Produto>(`${this.apiUrl}/${id}`);
  }

  criar(produto: CriarProdutoRequest): Observable<Produto> {
    return this.http.post<Produto>(this.apiUrl, produto);
  }

  atualizar(id: string, produto: AtualizarProdutoRequest): Observable<Produto> {
    return this.http.put<Produto>(`${this.apiUrl}/${id}`, produto);
  }

  excluir(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  alternarDisponibilidade(id: string, disponivel: boolean): Observable<Produto> {
    return this.atualizar(id, { disponivel });
  }
}
