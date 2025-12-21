import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, throwError } from 'rxjs';

export interface ClienteAuth {
  id: string;
  nome: string;
  telefone?: string;
  email?: string;
  fotoUrl?: string;
  googleVinculado: boolean;
}

export interface ClienteLoginResponse {
  token: string;
  tipo: string;
  cliente: ClienteAuth;
}

export interface ClienteLoginRequest {
  telefone: string;
  senha: string;
}

export interface ClienteGoogleLoginRequest {
  googleToken: string;
}

export interface DefinirSenhaRequest {
  senha: string;
  confirmacaoSenha: string;
}

const TOKEN_KEY = 'cliente-auth-token';
const CLIENTE_KEY = 'cliente-auth-data';

@Injectable({
  providedIn: 'root'
})
export class ClienteAuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/publico/cliente/auth';
  private readonly contaUrl = '/api/cliente/conta';

  private readonly _clienteLogado = new BehaviorSubject<ClienteAuth | null>(null);
  private readonly _token = new BehaviorSubject<string | null>(null);

  readonly clienteLogado$ = this._clienteLogado.asObservable();
  readonly token$ = this._token.asObservable();

  constructor() {
    this.restaurarSessao();
  }

  get clienteLogado(): ClienteAuth | null {
    return this._clienteLogado.value;
  }

  get token(): string | null {
    return this._token.value;
  }

  get estaLogado(): boolean {
    return !!this._token.value;
  }

  /**
   * Login com telefone e senha
   */
  login(request: ClienteLoginRequest): Observable<ClienteLoginResponse> {
    return this.http.post<ClienteLoginResponse>(`${this.baseUrl}/login`, request)
      .pipe(tap(response => this.salvarSessao(response)));
  }

  /**
   * Login/Cadastro via Google OAuth
   */
  loginGoogle(googleToken: string): Observable<ClienteLoginResponse> {
    const request: ClienteGoogleLoginRequest = { googleToken };
    return this.http.post<ClienteLoginResponse>(`${this.baseUrl}/google`, request)
      .pipe(tap(response => this.salvarSessao(response)));
  }

  /**
   * Define senha para o cliente (para poder fazer login sem Google)
   * Headers são adicionados automaticamente pelo clienteAuthInterceptor
   */
  definirSenha(request: DefinirSenhaRequest): Observable<ClienteAuth> {
    if (!this._clienteLogado.value?.id) {
      return throwError(() => new Error('Cliente não está logado'));
    }
    return this.http.post<ClienteAuth>(`${this.contaUrl}/senha`, request);
  }

  /**
   * Vincula conta Google ao cliente logado
   * Headers são adicionados automaticamente pelo clienteAuthInterceptor
   */
  vincularGoogle(googleToken: string): Observable<ClienteAuth> {
    if (!this._clienteLogado.value?.id) {
      return throwError(() => new Error('Cliente não está logado'));
    }
    return this.http.post<ClienteAuth>(`${this.contaUrl}/vincular-google`, { googleToken })
      .pipe(tap(cliente => this._clienteLogado.next(cliente)));
  }

  /**
   * Desvincula conta Google do cliente logado
   * Headers são adicionados automaticamente pelo clienteAuthInterceptor
   */
  desvincularGoogle(): Observable<ClienteAuth> {
    if (!this._clienteLogado.value?.id) {
      return throwError(() => new Error('Cliente não está logado'));
    }
    return this.http.delete<ClienteAuth>(`${this.contaUrl}/desvincular-google`)
      .pipe(tap(cliente => this._clienteLogado.next(cliente)));
  }

  /**
   * Atualiza telefone do cliente logado
   * Headers são adicionados automaticamente pelo clienteAuthInterceptor
   */
  atualizarTelefone(telefone: string): Observable<ClienteAuth> {
    if (!this._clienteLogado.value?.id) {
      return throwError(() => new Error('Cliente não está logado'));
    }
    return this.http.put<ClienteAuth>(`${this.contaUrl}/telefone`, { telefone })
      .pipe(tap(cliente => this._clienteLogado.next(cliente)));
  }

  /**
   * Logout - limpa sessão local
   */
  logout(): void {
    this._clienteLogado.next(null);
    this._token.next(null);

    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(CLIENTE_KEY);
    }
  }

  /**
   * Salva sessão no sessionStorage (persiste apenas na aba atual)
   */
  private salvarSessao(response: ClienteLoginResponse): void {
    this._token.next(response.token);
    this._clienteLogado.next(response.cliente);

    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(TOKEN_KEY, response.token);
      sessionStorage.setItem(CLIENTE_KEY, JSON.stringify(response.cliente));
    }
  }

  /**
   * Restaura sessão do sessionStorage
   */
  private restaurarSessao(): void {
    if (typeof sessionStorage === 'undefined') return;

    const token = sessionStorage.getItem(TOKEN_KEY);
    const clienteStr = sessionStorage.getItem(CLIENTE_KEY);

    if (token && clienteStr) {
      try {
        const cliente = JSON.parse(clienteStr) as ClienteAuth;
        this._token.next(token);
        this._clienteLogado.next(cliente);
      } catch {
        this.logout();
      }
    }
  }
}
