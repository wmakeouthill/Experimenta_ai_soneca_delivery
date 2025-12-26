import { Component, inject, signal, computed, OnInit, AfterViewInit, AfterViewChecked, OnDestroy, ChangeDetectionStrategy, PLATFORM_ID, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil, firstValueFrom } from 'rxjs';
import { MotoboyAuthService } from '../../services/motoboy-auth.service';
import { GoogleSignInService } from '../../services/google-signin.service';

@Component({
    selector: 'app-cadastro-motoboy',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './cadastro-motoboy.component.html',
    styleUrls: ['./cadastro-motoboy.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CadastroMotoboyComponent implements OnInit, AfterViewInit, AfterViewChecked, OnDestroy {
    private readonly motoboyAuthService = inject(MotoboyAuthService);
    private readonly googleSignInService = inject(GoogleSignInService);
    private readonly router = inject(Router);
    private readonly cdr = inject(ChangeDetectorRef);
    private readonly platformId = inject(PLATFORM_ID);
    private readonly isBrowser = isPlatformBrowser(this.platformId);
    private readonly destroy$ = new Subject<void>();

    @ViewChild('googleButton') googleButtonRef?: ElementRef<HTMLDivElement>;
    private googleButtonRendered = false;

    // Estado
    readonly carregando = signal(false);
    readonly erro = signal<string | null>(null);
    readonly googleIniciado = signal(false);

    // PWA
    readonly mostrarBannerPwa = signal(false);
    readonly isStandalone = signal(false);
    private deferredPrompt: any = null;

    constructor() {
        // Verifica se já está autenticado
        if (this.isBrowser && this.motoboyAuthService.isAuthenticated()) {
            this.router.navigate(['/motoboy/kanban']);
        }
    }

    ngOnInit(): void {
        // Não inicializa aqui - será feito no ngAfterViewInit como na tela /delivery
    }

    async ngAfterViewInit(): Promise<void> {
        if (!this.isBrowser) return;

        // Inicializa PWA detection
        this.inicializarPWA();

        // Segue o mesmo padrão da tela /delivery: inicializa e depois renderiza
        await this.inicializarGoogle();
        // Aguarda um ciclo para garantir que o DOM está totalmente renderizado
        setTimeout(() => {
            this.renderizarBotaoGoogle();
        }, 0);
    }

    ngAfterViewChecked(): void {
        // Tenta renderizar o botão do Google sempre que a view for checada
        // Isso garante que o botão seja renderizado quando o elemento estiver disponível
        // Mesmo padrão da tela /delivery
        if (this.isBrowser) {
            this.renderizarBotaoGoogle();
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    /**
     * Inicializa o Google Sign-In SDK
     * Segue o mesmo padrão da tela /delivery
     */
    private async inicializarGoogle(): Promise<void> {
        if (!this.isBrowser) return;

        try {
            console.log('🔄 Inicializando Google Sign-In...');
            await this.googleSignInService.initialize();
            this.googleIniciado.set(true);
            this.cdr.markForCheck();
            console.log('✅ Google Sign-In inicializado com sucesso');

            // Escutar credenciais do Google
            this.googleSignInService.credential$
                .pipe(takeUntil(this.destroy$))
                .subscribe(async (token) => {
                    await this.processarLoginGoogle(token);
                });
        } catch (e) {
            console.error('❌ Erro ao inicializar Google Sign-In:', e);
            this.erro.set('Erro ao carregar login com Google');
            this.cdr.markForCheck();
        }
    }

    /**
     * Renderiza o botão do Google Sign-In
     * Segue exatamente o mesmo padrão da tela /delivery para garantir renderização confiável
     */
    private renderizarBotaoGoogle(): void {
        if (!this.isBrowser) return;

        const element = this.googleButtonRef?.nativeElement;

        // Debug: verifica estado atual
        if (!element) {
            console.debug('⏳ Elemento do botão Google ainda não disponível');
            return;
        }

        if (this.googleButtonRendered) {
            console.debug('✅ Botão Google já foi renderizado');
            return;
        }

        if (!this.googleIniciado()) {
            console.debug('⏳ Google Sign-In ainda não inicializado');
            return;
        }

        try {
            console.log('🔄 Renderizando botão Google...', {
                elementExists: !!element,
                elementVisible: element.offsetParent !== null,
                googleIniciado: this.googleIniciado()
            });

            // Limpa o conteúdo do elemento antes de renderizar (caso tenha sido renderizado antes)
            if (element.children.length > 0) {
                element.innerHTML = '';
            }

            this.googleSignInService.renderButton(element, {
                theme: 'outline',
                size: 'large',
                text: 'continue_with',
                shape: 'rectangular',
                width: 300
            });

            this.googleButtonRendered = true;
            this.cdr.markForCheck();

            console.log('✅ Botão Google renderizado com sucesso');
        } catch (e) {
            console.error('❌ Erro ao renderizar botão Google:', e);
            // Reseta o flag para tentar novamente no próximo ciclo
            this.googleButtonRendered = false;
        }
    }

    /**
     * Processa login via Google OAuth
     */
    private async processarLoginGoogle(googleToken: string): Promise<void> {
        this.carregando.set(true);
        this.erro.set(null);
        this.cdr.detectChanges();

        try {
            const response = await firstValueFrom(this.motoboyAuthService.loginGoogle(googleToken));

            if (response && response.token && response.motoboy) {
                // Aguarda um pouco para garantir que o sessionStorage foi persistido
                // O método salvarSessao já foi chamado pelo tap() no pipe
                await new Promise(resolve => setTimeout(resolve, 300));

                // Verifica se a sessão foi salva corretamente
                let tokenSalvo = this.motoboyAuthService.getToken();
                let motoboySalvo = this.motoboyAuthService.motoboyLogado;

                // Se ainda não foi salvo, tenta salvar manualmente
                if (!tokenSalvo || !motoboySalvo) {
                    console.warn('⚠️ Sessão não foi salva automaticamente. Tentando salvar manualmente...');
                    if (typeof sessionStorage !== 'undefined') {
                        try {
                            sessionStorage.setItem('motoboy-auth-token', response.token);
                            sessionStorage.setItem('motoboy-auth-data', JSON.stringify(response.motoboy));

                            // Verifica novamente
                            tokenSalvo = this.motoboyAuthService.getToken();
                            motoboySalvo = this.motoboyAuthService.motoboyLogado;
                        } catch (e) {
                            console.error('❌ Erro ao salvar sessão manualmente:', e);
                        }
                    }
                }

                // Verifica novamente após tentativa manual
                if (!tokenSalvo || !motoboySalvo) {
                    console.error('❌ Sessão não foi salva corretamente após login');
                    this.erro.set('Erro ao salvar sessão. Tente novamente.');
                    this.carregando.set(false);
                    this.cdr.detectChanges();
                    return;
                }

                console.log('✅ Login realizado com sucesso. Sessão salva. Redirecionando...', {
                    tokenLength: tokenSalvo.length,
                    motoboyId: motoboySalvo.id
                });

                // Aguarda mais um pouco para garantir que o sessionStorage foi totalmente persistido
                // Especialmente importante em mobile
                await new Promise(resolve => setTimeout(resolve, 200));

                // Redireciona para o kanban do motoboy usando window.location para garantir persistência
                // window.location.href força um reload completo, garantindo que o Angular reinicialize
                // e leia o sessionStorage corretamente
                window.location.href = '/motoboy/kanban';
            } else {
                console.error('Resposta de login inválida:', response);
                this.erro.set('Resposta de login inválida. Tente novamente.');
                this.carregando.set(false);
                this.cdr.detectChanges();
            }
        } catch (e: any) {
            console.error('Erro ao fazer login com Google:', e);
            const mensagem = e?.error?.message || e?.error?.error || 'Erro ao fazer login com Google. Tente novamente.';
            this.erro.set(mensagem);
            this.carregando.set(false);
            this.cdr.detectChanges();
        }
    }

    // ========== PWA ==========

    /**
     * Inicializa a detecção de modo PWA e configura o banner de instalação.
     */
    private inicializarPWA(): void {
        if (!this.isBrowser) return;

        // Detecta se está rodando como app instalado (standalone)
        const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches
            || (navigator as any).standalone === true;
        this.isStandalone.set(isStandaloneMode);

        // Mostra banner se não estiver em modo standalone
        if (!isStandaloneMode) {
            this.mostrarBannerPwa.set(true);
        }

        // Captura o evento beforeinstallprompt
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            if (!this.isStandalone()) {
                this.mostrarBannerPwa.set(true);
                this.cdr.markForCheck();
            }
        });

        // Detecta quando o app é instalado
        window.addEventListener('appinstalled', () => {
            console.log('[PWA] App instalado com sucesso');
            this.mostrarBannerPwa.set(false);
            this.deferredPrompt = null;
            this.isStandalone.set(true);
            this.cdr.markForCheck();
        });
    }

    /**
     * Instala o PWA quando o usuário clicar no botão.
     */
    async instalarPwa(): Promise<void> {
        if (!this.deferredPrompt) {
            console.warn('[PWA] Prompt de instalação não disponível');
            return;
        }

        try {
            this.deferredPrompt.prompt();
            const { outcome } = await this.deferredPrompt.userChoice;

            console.log(`[PWA] Usuário ${outcome === 'accepted' ? 'aceitou' : 'rejeitou'} a instalação`);

            if (outcome === 'accepted') {
                this.deferredPrompt = null;
            }

            this.mostrarBannerPwa.set(false);
            this.cdr.markForCheck();
        } catch (error) {
            console.error('[PWA] Erro ao instalar:', error);
        }
    }

    /**
     * Fecha o banner de instalação PWA.
     */
    fecharBannerPwa(): void {
        this.mostrarBannerPwa.set(false);
    }
}

