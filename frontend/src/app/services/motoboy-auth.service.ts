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
   * Salva a sessão do motoboy no sessionStorage.
   * Em mobile, garante que os dados sejam persistidos corretamente.
   */
  private salvarSessao(response: MotoboyLoginResponse): void {
    if (typeof sessionStorage === 'undefined') {
      console.error('❌ sessionStorage não está disponível');
      return;
    }

    if (!response.token) {
      console.error('❌ Token não recebido na resposta de login');
      return;
    }

    if (!response.motoboy || !response.motoboy.id) {
      console.error('❌ Dados do motoboy não recebidos na resposta de login');
      return;
    }

    try {
      // Salva token e dados do motoboy
      sessionStorage.setItem(TOKEN_KEY, response.token);
      sessionStorage.setItem(MOTOBOY_KEY, JSON.stringify(response.motoboy));

      // Verifica se foi salvo corretamente (importante em mobile)
      const tokenVerificado = sessionStorage.getItem(TOKEN_KEY);
      const motoboyVerificado = sessionStorage.getItem(MOTOBOY_KEY);

      if (!tokenVerificado || !motoboyVerificado) {
        console.error('❌ Falha ao persistir sessão no sessionStorage');
        // Tenta novamente
        sessionStorage.setItem(TOKEN_KEY, response.token);
        sessionStorage.setItem(MOTOBOY_KEY, JSON.stringify(response.motoboy));
      }

      // Verifica novamente após segunda tentativa
      const tokenVerificado2 = sessionStorage.getItem(TOKEN_KEY);
      const motoboyVerificado2 = sessionStorage.getItem(MOTOBOY_KEY);

      if (tokenVerificado2 && motoboyVerificado2) {
        console.log('✅ Sessão do motoboy salva com sucesso:', {
          tokenLength: response.token.length,
          motoboyId: response.motoboy.id,
          motoboyNome: response.motoboy.nome,
          tokenSalvo: tokenVerificado2.substring(0, 20) + '...',
          motoboySalvo: JSON.parse(motoboyVerificado2).id
        });
      } else {
        console.error('❌ Falha crítica ao salvar sessão. sessionStorage pode estar bloqueado.');
        throw new Error('Falha ao salvar sessão no sessionStorage');
      }
    } catch (error) {
      console.error('❌ Erro ao salvar sessão:', error);
      // Em caso de erro, tenta usar try-catch para evitar quebrar o fluxo
      try {
        sessionStorage.setItem(TOKEN_KEY, response.token);
        sessionStorage.setItem(MOTOBOY_KEY, JSON.stringify(response.motoboy));
      } catch (e) {
        console.error('❌ Erro crítico ao salvar sessão:', e);
      }
    }
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

