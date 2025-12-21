import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ConfigAnimacao {
  animacaoAtivada: boolean;
  intervaloAnimacao: number;
  duracaoAnimacao: number;
  video1Url?: string | null;
  video2Url?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class ConfigAnimacaoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/config-animacao';

  carregar(): Observable<ConfigAnimacao> {
    // O interceptor silent500ConfigInterceptor já trata erros 500
    return this.http.get<ConfigAnimacao>(this.apiUrl);
  }

  salvar(config: ConfigAnimacao): Observable<ConfigAnimacao> {
    // O interceptor silent500ConfigInterceptor já trata erros 500
    return this.http.post<ConfigAnimacao>(this.apiUrl, config);
  }
}

