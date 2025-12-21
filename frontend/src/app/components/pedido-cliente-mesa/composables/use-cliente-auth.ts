import { signal, computed, inject, effect } from '@angular/core';
import { ClienteAuthService, ClienteAuth, ClienteLoginRequest } from '../../../services/cliente-auth.service';
import { GoogleSignInService } from '../../../services/google-signin.service';
import { Subscription } from 'rxjs';

/**
 * Composable para gerenciar autenticação do cliente.
 * Suporta login com telefone/senha e Google OAuth.
 */
export function useClienteAuth() {
    const authService = inject(ClienteAuthService);
    const googleService = inject(GoogleSignInService);

    // Estado
    const cliente = signal<ClienteAuth | null>(authService.clienteLogado);
    const carregando = signal(false);
    const erro = signal<string | null>(null);
    const googleInicializado = signal(false);

    // Computed
    const estaLogado = computed(() => cliente() !== null);
    const temGoogle = computed(() => cliente()?.googleVinculado ?? false);

    // Subscription para credenciais do Google
    let googleSub: Subscription | null = null;

    /**
     * Inicializa o Google Sign-In
     */
    async function inicializarGoogle(buttonElement?: HTMLElement): Promise<void> {
        try {
            await googleService.initialize();
            googleInicializado.set(true);

            // Renderiza botão se elemento fornecido
            if (buttonElement) {
                googleService.renderButton(buttonElement, {
                    theme: 'outline',
                    size: 'large',
                    text: 'continue_with'
                });
            }

            // Escuta credenciais do Google
            if (!googleSub) {
                googleSub = googleService.credential$.subscribe(async (token) => {
                    await loginComGoogle(token);
                });
            }
        } catch (e) {
            console.error('Erro ao inicializar Google Sign-In:', e);
            erro.set('Erro ao carregar login com Google');
        }
    }

    /**
     * Login com telefone e senha
     */
    async function loginComSenha(telefone: string, senha: string): Promise<boolean> {
        carregando.set(true);
        erro.set(null);

        try {
            const request: ClienteLoginRequest = { telefone, senha };
            const response = await authService.login(request).toPromise();

            if (response) {
                cliente.set(response.cliente);
                return true;
            }
            return false;
        } catch (e: any) {
            const mensagem = e?.error?.message || 'Erro ao fazer login';
            erro.set(mensagem);
            return false;
        } finally {
            carregando.set(false);
        }
    }

    /**
     * Login/Cadastro com Google
     */
    async function loginComGoogle(googleToken: string): Promise<boolean> {
        carregando.set(true);
        erro.set(null);

        try {
            const response = await authService.loginGoogle(googleToken).toPromise();

            if (response) {
                cliente.set(response.cliente);
                return true;
            }
            return false;
        } catch (e: any) {
            const mensagem = e?.error?.message || 'Erro ao fazer login com Google';
            erro.set(mensagem);
            return false;
        } finally {
            carregando.set(false);
        }
    }

    /**
     * Vincula conta Google ao cliente logado
     */
    async function vincularGoogle(googleToken: string): Promise<boolean> {
        carregando.set(true);
        erro.set(null);

        try {
            const clienteAtualizado = await authService.vincularGoogle(googleToken).toPromise();

            if (clienteAtualizado) {
                cliente.set(clienteAtualizado);
                return true;
            }
            return false;
        } catch (e: any) {
            const mensagem = e?.error?.message || 'Erro ao vincular Google';
            erro.set(mensagem);
            return false;
        } finally {
            carregando.set(false);
        }
    }

    /**
     * Desvincula conta Google
     */
    async function desvincularGoogle(): Promise<boolean> {
        carregando.set(true);
        erro.set(null);

        try {
            const clienteAtualizado = await authService.desvincularGoogle().toPromise();

            if (clienteAtualizado) {
                cliente.set(clienteAtualizado);
                return true;
            }
            return false;
        } catch (e: any) {
            const mensagem = e?.error?.message || 'Erro ao desvincular Google';
            erro.set(mensagem);
            return false;
        } finally {
            carregando.set(false);
        }
    }

    /**
     * Logout
     */
    function logout(): void {
        authService.logout();
        cliente.set(null);
        erro.set(null);
    }

    /**
     * Limpa subscription ao destruir
     */
    function destroy(): void {
        googleSub?.unsubscribe();
        googleSub = null;
    }

    return {
        // Estado
        cliente: cliente.asReadonly(),
        carregando: carregando.asReadonly(),
        erro: erro.asReadonly(),
        googleInicializado: googleInicializado.asReadonly(),

        // Computed
        estaLogado,
        temGoogle,

        // Ações
        inicializarGoogle,
        loginComSenha,
        loginComGoogle,
        vincularGoogle,
        desvincularGoogle,
        logout,
        destroy
    };
}
