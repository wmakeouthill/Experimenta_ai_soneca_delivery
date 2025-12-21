import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Mesa {
    id: string;
    numero: number;
    nome: string;
    qrCodeToken: string;
    ativa: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CriarMesaRequest {
    numero: number;
    nome: string;
}

export interface AtualizarMesaRequest {
    numero?: number;
    nome?: string;
    ativa?: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class MesaService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = '/api/mesas';
    private readonly publicApiUrl = '/api/public/mesa';

    listar(ativas?: boolean): Observable<Mesa[]> {
        let params = new HttpParams();
        if (ativas !== undefined) {
            params = params.set('ativas', ativas.toString());
        }
        return this.http.get<Mesa[]>(this.apiUrl, { params });
    }

    buscarPorId(id: string): Observable<Mesa> {
        return this.http.get<Mesa>(`${this.apiUrl}/${id}`);
    }

    buscarPorToken(token: string): Observable<Mesa> {
        return this.http.get<Mesa>(`${this.publicApiUrl}/${token}`);
    }

    criar(request: CriarMesaRequest): Observable<Mesa> {
        return this.http.post<Mesa>(this.apiUrl, request);
    }

    atualizar(id: string, request: AtualizarMesaRequest): Observable<Mesa> {
        return this.http.put<Mesa>(`${this.apiUrl}/${id}`, request);
    }

    excluir(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    gerarUrlQrCode(qrCodeToken: string): string {
        // URL base do site + rota pública do pedido
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        return `${baseUrl}/pedido-mesa/${qrCodeToken}`;
    }
}
