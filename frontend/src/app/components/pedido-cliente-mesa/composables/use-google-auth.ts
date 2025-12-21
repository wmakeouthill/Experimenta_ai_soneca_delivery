import { signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Subscription } from 'rxjs';
import { GoogleSignInService } from '../../../services/google-signin.service';
import { useClienteAuth } from './use-cliente-auth';

export interface GoogleAuthResult {
    success: boolean;
    cliente?: {
        id: string;
        nome: string;
        telefone: string;
    };
}

/**
 * Composable para gerenciar autenticação via Google OAuth.
 * Responsabilidade única: login e vinculação de conta Google.
 */
export function useGoogleAuth(
    getClienteIdentificado: () => { id: string } | null,
    onLoginSucesso: (cliente: { id: string; nome: string; telefone: string }) => void
) {
    const platformId = inject(PLATFORM_ID);
    const isBrowser = isPlatformBrowser(platformId);
    const googleService = inject(GoogleSignInService);
    const clienteAuth = useClienteAuth();

    // Estado
    const inicializado = signal(false);
    const processando = signal(false);
    const erro = signal<string | null>(null);
    const botaoRenderizado = signal(false);

    // Subscription
    let credentialSub: Subscription | null = null;

    /**
     * Inicializa o Google Sign-In SDK
     */
    async function inicializar(): Promise<void> {
        if (!isBrowser || inicializado()) return;

        try {
            await googleService.initialize();
            inicializado.set(true);

            // Escuta credenciais do Google
            credentialSub = googleService.credential$.subscribe(async (token) => {
                if (getClienteIdentificado()) {
                    await processarVinculacao(token);
                } else {
                    await processarLogin(token);
                }
            });
        } catch (e) {
            console.error('Erro ao inicializar Google Sign-In:', e);
            erro.set('Erro ao carregar login com Google');
        }
    }

    /**
     * Renderiza o botão oficial do Google em um elemento
     */
    function renderizarBotao(element: HTMLElement): void {
        if (!isBrowser || botaoRenderizado()) return;

        // Se ainda não inicializou, posterga até o próximo ciclo
        if (!inicializado()) {
            queueMicrotask(() => renderizarBotao(element));
            return;
        }

        try {
            googleService.renderButton(element, {
                theme: 'outline',
                size: 'large',
                text: 'continue_with',
                shape: 'rectangular',
                width: 280
            });
            botaoRenderizado.set(true);
        } catch (e) {
            console.error('Erro ao renderizar botão Google:', e);
        }
    }

    /**
     * Abre o prompt do Google One Tap
     */
    function abrirPrompt(): void {
        if (!inicializado()) return;
        googleService.showOneTap();
    }

    /**
     * Processa login via Google
     */
    async function processarLogin(idToken: string): Promise<void> {
        processando.set(true);
        erro.set(null);

        try {
            const success = await clienteAuth.loginComGoogle(idToken);
            if (success) {
                const cliente = clienteAuth.cliente();
                if (cliente) {
                    onLoginSucesso({
                        id: cliente.id,
                        nome: cliente.nome,
                        telefone: cliente.telefone || ''
                    });
                }
            }
        } catch (e) {
            console.error('Erro no login com Google:', e);
            erro.set('Erro ao fazer login com Google');
        } finally {
            processando.set(false);
        }
    }

    /**
     * Processa vinculação de conta Google
     */
    async function processarVinculacao(idToken: string): Promise<void> {
        processando.set(true);
        erro.set(null);

        try {
            await clienteAuth.vincularGoogle(idToken);
        } catch (e) {
            console.error('Erro ao vincular Google:', e);
            erro.set('Erro ao vincular conta Google');
        } finally {
            processando.set(false);
        }
    }

    /**
     * Desvincula conta Google
     */
    async function desvincular(): Promise<boolean> {
        processando.set(true);
        erro.set(null);

        try {
            await clienteAuth.desvincularGoogle();
            return true;
        } catch (e) {
            console.error('Erro ao desvincular Google:', e);
            erro.set('Erro ao desvincular conta Google');
            return false;
        } finally {
            processando.set(false);
        }
    }

    /**
     * Cleanup - deve ser chamado no ngOnDestroy
     */
    function destroy(): void {
        credentialSub?.unsubscribe();
        credentialSub = null;
        clienteAuth.destroy();
    }

    return {
        // Estado
        inicializado: inicializado.asReadonly(),
        processando: processando.asReadonly(),
        erro: erro.asReadonly(),
        botaoRenderizado: botaoRenderizado.asReadonly(),

        // Cliente Auth (para acessar dados do cliente logado)
        clienteAuth,

        // Ações
        inicializar,
        renderizarBotao,
        abrirPrompt,
        desvincular,
        destroy
    };
}
