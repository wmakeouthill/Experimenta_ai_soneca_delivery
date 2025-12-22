import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Adicional {
    id: string;
    nome: string;
    descricao: string;
    preco: number;
    categoria: string;
    disponivel: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CriarAdicionalRequest {
    nome: string;
    descricao?: string;
    preco: number;
    categoria?: string;
}

export interface AtualizarAdicionalRequest {
    nome?: string;
    descricao?: string;
    preco?: number;
    categoria?: string;
    disponivel?: boolean;
}

export interface AdicionalFilters {
    categoria?: string;
    disponivel?: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class AdicionalService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = '/api/adicionais';

    listar(filters?: AdicionalFilters): Observable<Adicional[]> {
        let params = new HttpParams();

        if (filters?.categoria) {
            params = params.set('categoria', filters.categoria);
        }

        if (filters?.disponivel !== undefined) {
            params = params.set('disponivel', filters.disponivel);
        }

        return this.http.get<Adicional[]>(this.apiUrl, { params });
    }

    buscarPorId(id: string): Observable<Adicional> {
        return this.http.get<Adicional>(`${this.apiUrl}/${id}`);
    }

    criar(adicional: CriarAdicionalRequest): Observable<Adicional> {
        return this.http.post<Adicional>(this.apiUrl, adicional);
    }

    atualizar(id: string, adicional: AtualizarAdicionalRequest): Observable<Adicional> {
        return this.http.put<Adicional>(`${this.apiUrl}/${id}`, adicional);
    }

    excluir(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    alternarDisponibilidade(id: string, disponivel: boolean): Observable<Adicional> {
        return this.atualizar(id, { disponivel });
    }

    // === Métodos para vincular adicionais a produtos ===

    listarAdicionaisDoProduto(produtoId: string): Observable<Adicional[]> {
        return this.http.get<Adicional[]>(`/api/produtos/${produtoId}/adicionais`);
    }

    /**
     * Lista adicionais de um produto usando endpoint público (sem autenticação).
     * Usado para contexto de delivery/cliente.
     */
    listarAdicionaisDoProdutoPublico(produtoId: string): Observable<Adicional[]> {
        return this.http.get<Adicional[]>(`/api/public/delivery/produtos/${produtoId}/adicionais`);
    }

    atualizarAdicionaisDoProduto(produtoId: string, adicionalIds: string[]): Observable<void> {
        return this.http.put<void>(`/api/produtos/${produtoId}/adicionais`, adicionalIds);
    }

    vincularAdicional(produtoId: string, adicionalId: string): Observable<void> {
        return this.http.post<void>(`/api/produtos/${produtoId}/adicionais/${adicionalId}`, {});
    }

    desvincularAdicional(produtoId: string, adicionalId: string): Observable<void> {
        return this.http.delete<void>(`/api/produtos/${produtoId}/adicionais/${adicionalId}`);
    }
}
