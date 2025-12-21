import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Categoria {
  id: string;
  nome: string;
  descricao: string;
  ativa: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CriarCategoriaRequest {
  nome: string;
  descricao?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CategoriaService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/categorias';

  listar(ativas?: boolean): Observable<Categoria[]> {
    let params = new HttpParams();
    
    if (ativas !== undefined) {
      params = params.set('ativas', ativas);
    }
    
    return this.http.get<Categoria[]>(this.apiUrl, { params });
  }

  criar(categoria: CriarCategoriaRequest): Observable<Categoria> {
    return this.http.post<Categoria>(this.apiUrl, categoria);
  }
}
