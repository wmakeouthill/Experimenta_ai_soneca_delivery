import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export enum StatusSessao {
  ABERTA = 'ABERTA',
  PAUSADA = 'PAUSADA',
  FINALIZADA = 'FINALIZADA'
}

export interface SessaoTrabalho {
  id: string;
  numeroSessao: number;
  dataInicio: string;
  dataInicioCompleta: string;
  dataFim?: string;
  status: StatusSessao;
  usuarioId: string;
  nome: string;
  valorAbertura?: number;
  valorFechamento?: number;
  createdAt: string;
  updatedAt: string;
}

export interface IniciarSessaoRequest {
  usuarioId: string;
  valorAbertura: number;
}

export interface FinalizarSessaoRequest {
  valorFechamento: number;
}

@Injectable({
  providedIn: 'root'
})
export class SessaoTrabalhoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/sessoes-trabalho';

  iniciar(usuarioId: string, valorAbertura: number): Observable<SessaoTrabalho> {
    const request: IniciarSessaoRequest = { usuarioId, valorAbertura };
    return this.http.post<SessaoTrabalho>(this.apiUrl, request);
  }

  pausar(id: string): Observable<SessaoTrabalho> {
    return this.http.put<SessaoTrabalho>(`${this.apiUrl}/${id}/pausar`, {});
  }

  retomar(id: string): Observable<SessaoTrabalho> {
    return this.http.put<SessaoTrabalho>(`${this.apiUrl}/${id}/retomar`, {});
  }

  finalizar(id: string, valorFechamento: number): Observable<SessaoTrabalho> {
    const request: FinalizarSessaoRequest = { valorFechamento };
    return this.http.put<SessaoTrabalho>(`${this.apiUrl}/${id}/finalizar`, request);
  }

  buscarAtiva(): Observable<SessaoTrabalho | null> {
    return this.http.get<SessaoTrabalho>(`${this.apiUrl}/ativa`).pipe(
      catchError((error: HttpErrorResponse) => {
        // 404 é esperado quando não há sessão ativa - não é um erro
        // Nota: O log no console do navegador é normal e vem do DevTools,
        // não do código JavaScript. O erro é tratado silenciosamente aqui.
        if (error.status === 404) {
          return of(null);
        }
        // Outros erros são tratados normalmente
        return throwError(() => error);
      })
    );
  }

  listar(filters?: {
    dataInicio?: string;
  }): Observable<SessaoTrabalho[]> {
    let params = new HttpParams();
    
    if (filters?.dataInicio) {
      params = params.set('dataInicio', filters.dataInicio);
    }
    
    return this.http.get<SessaoTrabalho[]>(this.apiUrl, { params });
  }
}

