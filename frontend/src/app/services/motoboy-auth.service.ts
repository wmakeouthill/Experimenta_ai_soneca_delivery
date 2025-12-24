import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface MotoboyAuth {
  id: string;
  nome: string;
  apelido?: string;
  telefone?: string;
  email?: string;
  fotoUrl?: string;
  veiculo?: string;
  placa?: string;
  ativo: boolean;
  googleId?: string;
}

export interface MotoboyLoginResponse {
  token: string;
  tipo: string;
  motoboy: MotoboyAuth;
}

export interface MotoboyGoogleLoginRequest {
  googleToken: string;
}

const TOKEN_KEY = 'motoboy-auth-token';
const MOTOBOY_KEY = 'motoboy-auth-data';

@Injectable({
  providedIn: 'root'
})
export class MotoboyAuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/publico/motoboy/auth';

  /**
   * Obtém o motoboy logado do sessionStorage.
   */
  get motoboyLogado(): MotoboyAuth | null {
    if (typeof sessionStorage === 'undefined') {
      return null;
    }

    const motoboyStr = sessionStorage.getItem(MOTOBOY_KEY);
    if (!motoboyStr) {
      return null;
    }

    try {
      return JSON.parse(motoboyStr);
    } catch {
      return null;
    }
  }

  /**
   * Verifica se há um motoboy autenticado.
   */
  isAuthenticated(): boolean {
    return this.motoboyLogado !== null && this.getToken() !== null;
  }

  /**
   * Obtém o token JWT do sessionStorage.
   */
  getToken(): string | null {
    if (typeof sessionStorage === 'undefined') {
      return null;
    }
    return sessionStorage.getItem(TOKEN_KEY);
  }

  /**
   * Login/Cadastro via Google OAuth.
   * Headers são adicionados automaticamente pelo motoboyAuthInterceptor
   */
  loginGoogle(googleToken: string): Observable<MotoboyLoginResponse> {
    const request: MotoboyGoogleLoginRequest = { googleToken };
    return this.http.post<MotoboyLoginResponse>(`${this.apiUrl}/google`, request).pipe(
      tap(response => {
        this.salvarSessao(response);
      })
    );
  }

  /**
   * Salva a sessão do motoboy no sessionStorage.
   */
  private salvarSessao(response: MotoboyLoginResponse): void {
    if (typeof sessionStorage === 'undefined') {
      return;
    }

    sessionStorage.setItem(TOKEN_KEY, response.token);
    sessionStorage.setItem(MOTOBOY_KEY, JSON.stringify(response.motoboy));
  }

  /**
   * Faz logout do motoboy, removendo dados do sessionStorage.
   */
  logout(): void {
    if (typeof sessionStorage === 'undefined') {
      return;
    }

    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(MOTOBOY_KEY);
  }
}

