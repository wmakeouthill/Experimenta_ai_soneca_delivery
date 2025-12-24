import { Component, inject, signal, computed, OnInit, AfterViewInit, OnDestroy, ChangeDetectionStrategy, PLATFORM_ID, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
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
export class CadastroMotoboyComponent implements OnInit, AfterViewInit, OnDestroy {
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

    constructor() {
        // Verifica se já está autenticado
        if (this.isBrowser && this.motoboyAuthService.isAuthenticated()) {
            this.router.navigate(['/motoboy/kanban']);
        }
    }

    ngOnInit(): void {
        if (!this.isBrowser) return;
        this.inicializarGoogle();
    }

    ngAfterViewInit(): void {
        if (!this.isBrowser) return;
        // Aguarda um pouco para garantir que o DOM está renderizado
        setTimeout(() => this.renderizarBotaoGoogle(), 100);
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    /**
     * Inicializa o Google Sign-In SDK
     */
    private async inicializarGoogle(): Promise<void> {
        try {
            await this.googleSignInService.initialize();
            this.googleIniciado.set(true);
            this.cdr.detectChanges();

            // Escutar credenciais do Google
            this.googleSignInService.credential$
                .pipe(takeUntil(this.destroy$))
                .subscribe(async (token) => {
                    await this.processarLoginGoogle(token);
                });
        } catch (e) {
            console.error('Erro ao inicializar Google Sign-In:', e);
            this.erro.set('Erro ao carregar login com Google');
        }
    }

    /**
     * Renderiza o botão do Google Sign-In
     */
    private renderizarBotaoGoogle(): void {
        if (this.googleButtonRendered || !this.googleButtonRef?.nativeElement || !this.googleIniciado()) {
            return;
        }

        try {
            this.googleSignInService.renderButton(this.googleButtonRef.nativeElement, {
                theme: 'outline',
                size: 'large',
                text: 'continue_with',
                shape: 'rectangular',
                width: 300
            });
            this.googleButtonRendered = true;
            this.cdr.detectChanges();
        } catch (e) {
            console.error('Erro ao renderizar botão Google:', e);
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
}

