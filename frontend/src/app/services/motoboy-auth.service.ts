import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';

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

  // BehaviorSubjects para estado síncrono (resolve timing issues após login OAuth)
  private readonly _token = new BehaviorSubject<string | null>(null);
  private readonly _motoboyLogado = new BehaviorSubject<MotoboyAuth | null>(null);

  // Observables expostos
  readonly token$ = this._token.asObservable();
  readonly motoboyLogado$ = this._motoboyLogado.asObservable();

  constructor() {
    this.restaurarSessao();
  }

  /**
   * Getter síncrono do token (prioridade para interceptors).
   */
  get token(): string | null {
    return this._token.value;
  }

  /**
   * Getter síncrono do motoboy logado.
   * Prioriza BehaviorSubject, com fallback para sessionStorage.
   */
  get motoboyLogado(): MotoboyAuth | null {
    // Prioriza o BehaviorSubject (síncrono, atualizado imediatamente após login)
    const fromSubject = this._motoboyLogado.value;
    if (fromSubject) {
      return fromSubject;
    }

    // Fallback: sessionStorage (para casos de reload de página)
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
   * Verifica se está autenticado.
   */
  get estaLogado(): boolean {
    return !!this._token.value && !!this._motoboyLogado.value?.id;
  }

  /**
   * Verifica se há um motoboy autenticado.
   * Em mobile, verifica se o sessionStorage está acessível.
   * Ao recarregar a página, o sessionStorage persiste, então devemos ler novamente.
   */
  isAuthenticated(): boolean {
    if (typeof sessionStorage === 'undefined') {
      console.debug('⚠️ sessionStorage não disponível');
      return false;
    }

    // Sempre lê diretamente do sessionStorage para garantir que após recarregar a página,
    // os dados sejam lidos corretamente (sessionStorage persiste durante a sessão do navegador)
    try {
      const token = this.getToken();
      const motoboy = this.motoboyLogado;

      const isAuth = token !== null && motoboy !== null && motoboy.id !== null && motoboy.id !== '';

      if (!isAuth) {
        console.debug('🔍 Motoboy não autenticado:', {
          temToken: !!token,
          temMotoboy: !!motoboy,
          motoboyId: motoboy?.id,
          tokenStorage: sessionStorage.getItem(TOKEN_KEY) ? 'presente' : 'ausente',
          motoboyStorage: sessionStorage.getItem(MOTOBOY_KEY) ? 'presente' : 'ausente'
        });
      } else {
        console.debug('✅ Motoboy autenticado:', {
          motoboyId: motoboy.id,
          motoboyNome: motoboy.nome
        });
      }

      return isAuth;
    } catch (e) {
      console.warn('⚠️ Erro ao verificar autenticação:', e);
      return false;
    }
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
   * Salva a sessão do motoboy.
   * IMPORTANTE: Atualiza BehaviorSubjects PRIMEIRO (síncrono) para que interceptors
   * tenham acesso imediato ao token, depois persiste no sessionStorage.
   */
  private salvarSessao(response: MotoboyLoginResponse): void {
    if (!response.token) {
      console.error('❌ Token não recebido na resposta de login');
      return;
    }

    if (!response.motoboy || !response.motoboy.id) {
      console.error('❌ Dados do motoboy não recebidos na resposta de login');
      return;
    }

    // 1. Atualiza BehaviorSubjects PRIMEIRO (síncrono - resolve timing issues)
    this._token.next(response.token);
    this._motoboyLogado.next(response.motoboy);

    console.log('[MotoboyAuth] BehaviorSubjects atualizados:', {
      tokenLength: response.token.length,
      motoboyId: response.motoboy.id
    });

    // 2. Depois persiste no sessionStorage (para sobreviver a refreshes)
    if (typeof sessionStorage !== 'undefined') {
      try {
        sessionStorage.setItem(TOKEN_KEY, response.token);
        sessionStorage.setItem(MOTOBOY_KEY, JSON.stringify(response.motoboy));

        // Verifica se foi salvo corretamente
        const tokenVerificado = sessionStorage.getItem(TOKEN_KEY);
        const motoboyVerificado = sessionStorage.getItem(MOTOBOY_KEY);

        if (!tokenVerificado || !motoboyVerificado) {
          console.warn('⚠️ Falha na primeira tentativa de persistir no sessionStorage. Tentando novamente...');
          sessionStorage.setItem(TOKEN_KEY, response.token);
          sessionStorage.setItem(MOTOBOY_KEY, JSON.stringify(response.motoboy));
        }

        console.log('✅ Sessão do motoboy salva com sucesso:', {
          tokenLength: response.token.length,
          motoboyId: response.motoboy.id,
          motoboyNome: response.motoboy.nome
        });
      } catch (error) {
        console.error('❌ Erro ao salvar no sessionStorage:', error);
      }
    }
  }

  /**
   * Restaura sessão do sessionStorage para os BehaviorSubjects.
   * Chamado no construtor para hidratar o estado após refresh de página.
   */
  private restaurarSessao(): void {
    if (typeof sessionStorage === 'undefined') return;

    const token = sessionStorage.getItem(TOKEN_KEY);
    const motoboyStr = sessionStorage.getItem(MOTOBOY_KEY);

    if (token && motoboyStr) {
      try {
        const motoboy = JSON.parse(motoboyStr) as MotoboyAuth;
        this._token.next(token);
        this._motoboyLogado.next(motoboy);
        console.debug('[MotoboyAuth] Sessão restaurada do sessionStorage');
      } catch {
        this.logout();
      }
    }
  }

  /**
   * Faz logout do motoboy, limpando BehaviorSubjects e sessionStorage.
   */
  logout(): void {
    // Limpa BehaviorSubjects
    this._token.next(null);
    this._motoboyLogado.next(null);

    // Limpa sessionStorage
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(MOTOBOY_KEY);
    }
  }
}

