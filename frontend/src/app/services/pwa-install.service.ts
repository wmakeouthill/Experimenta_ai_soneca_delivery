import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

interface InstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

@Injectable({ providedIn: 'root' })
export class PwaInstallService {
    private deferred: InstallPromptEvent | null = null;
    private readonly prompt$ = new BehaviorSubject<boolean>(false);

    constructor(private readonly ngZone: NgZone) {
        if (typeof window !== 'undefined') {
            window.addEventListener('beforeinstallprompt', (event: Event) => {
                event.preventDefault();
                this.deferred = event as InstallPromptEvent;
                this.ngZone.run(() => this.prompt$.next(true));
            });
        }
    }

    isStandalone(): boolean {
        if (typeof window === 'undefined') return false;
        return window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;
    }

    wasDismissed(): boolean {
        return false; // sempre permitir novo prompt a cada reload
    }

    dismissPrompt(): void {
        this.prompt$.next(false);
    }

    shouldShow(): boolean {
        // Sempre mostrar banner se não estiver em standalone; o botão tenta o prompt quando disponível.
        return !this.isStandalone();
    }

    get onPromptChange() {
        return this.prompt$.asObservable();
    }

    async promptInstall(): Promise<boolean> {
        if (!this.deferred) return false;
        const prompt = this.deferred;
        this.deferred = null;
        this.prompt$.next(false);
        try {
            await prompt.prompt();
            const choice = await prompt.userChoice;
            if (choice.outcome === 'dismissed') {
                this.dismissPrompt();
            }
            return choice.outcome === 'accepted';
        } catch {
            return false;
        }
    }
}
