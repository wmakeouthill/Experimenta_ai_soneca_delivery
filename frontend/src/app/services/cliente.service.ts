import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  email?: string;
  cpf?: string;
  observacoes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CriarClienteRequest {
  nome: string;
  telefone: string;
  email?: string;
  cpf?: string;
  observacoes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ClienteService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/clientes';

  listar(filters?: {
    telefone?: string;
    nome?: string;
  }): Observable<Cliente[]> {
    let params = new HttpParams();
    
    if (filters?.telefone) {
      params = params.set('telefone', filters.telefone);
    }
    
    if (filters?.nome) {
      params = params.set('nome', filters.nome);
    }
    
    return this.http.get<Cliente[]>(this.apiUrl, { params });
  }

  buscarPorId(id: string): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.apiUrl}/${id}`);
  }

  criar(cliente: CriarClienteRequest): Observable<Cliente> {
    return this.http.post<Cliente>(this.apiUrl, cliente);
  }
}

