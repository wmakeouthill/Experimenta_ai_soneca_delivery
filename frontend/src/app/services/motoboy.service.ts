import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Motoboy {
    id: string;
    nome: string; // Nome completo do Google (read-only)
    apelido?: string; // Nome exibido, editável pelo admin
    telefone?: string; // Agora nullable (pode não ter se cadastrou via Google)
    veiculo?: string;
    placa?: string;
    ativo: boolean;
    // Campos de autenticação Google
    googleId?: string;
    email?: string;
    fotoUrl?: string;
    ultimoLogin?: string;
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
    apelido?: string; // Nome exibido editável pelo admin
    telefone?: string;
    veiculo?: string;
    placa?: string;
    ativo?: boolean;
    // Nota: nome, email, fotoUrl, googleId não podem ser editados (vêm do Google)
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
        let params = new HttpParams();
        if (apenasAtivos) {
            params = params.set('apenasAtivos', 'true');
        }
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
