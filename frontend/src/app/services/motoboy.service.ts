import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Motoboy {
    id: string;
    nome: string;
    telefone: string;
    veiculo?: string;
    placa?: string;
    ativo: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CriarMotoboyRequest {
    nome: string;
    telefone: string;
    veiculo?: string;
    placa?: string;
}

export interface AtualizarMotoboyRequest {
    nome?: string;
    telefone?: string;
    veiculo?: string;
    placa?: string;
    ativo?: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class MotoboyService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = '/api/motoboys';

    /**
     * Lista todos os motoboys.
     */
    listar(apenasAtivos: boolean = false): Observable<Motoboy[]> {
        const params = apenasAtivos ? { apenasAtivos: 'true' } : {};
        return this.http.get<Motoboy[]>(this.apiUrl, { params });
    }

    /**
     * Busca motoboy por ID.
     */
    buscarPorId(id: string): Observable<Motoboy> {
        return this.http.get<Motoboy>(`${this.apiUrl}/${id}`);
    }

    /**
     * Cria um novo motoboy.
     */
    criar(request: CriarMotoboyRequest): Observable<Motoboy> {
        return this.http.post<Motoboy>(this.apiUrl, request);
    }

    /**
     * Atualiza um motoboy existente.
     */
    atualizar(id: string, request: AtualizarMotoboyRequest): Observable<Motoboy> {
        return this.http.put<Motoboy>(`${this.apiUrl}/${id}`, request);
    }

    /**
     * Ativa um motoboy.
     */
    ativar(id: string): Observable<Motoboy> {
        return this.http.put<Motoboy>(`${this.apiUrl}/${id}/ativar`, {});
    }

    /**
     * Desativa um motoboy.
     */
    desativar(id: string): Observable<Motoboy> {
        return this.http.put<Motoboy>(`${this.apiUrl}/${id}/desativar`, {});
    }

    /**
     * Exclui um motoboy.
     */
    excluir(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
