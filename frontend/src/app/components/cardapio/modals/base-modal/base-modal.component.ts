import { Component, input, output, effect, inject, PLATFORM_ID, ChangeDetectionStrategy, computed } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

/**
 * Componente base reutilizável para modais.
 * Segue DRY - evita repetição de código de modal.
 */
@Component({
  selector: 'app-base-modal',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (aberto()) {
      <div class="modal-overlay" (click)="fecharPorOverlay()">
        <div class="modal-container" [class]="tamanhoClass()" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2 class="modal-titulo">{{ titulo() }}</h2>
            <button class="modal-fechar" (click)="fechar()" aria-label="Fechar">
              ✕
            </button>
          </div>
          <div class="modal-conteudo">
            <ng-content></ng-content>
          </div>
          @if (mostrarFooter()) {
            <div class="modal-footer">
              <ng-content select="[footer]"></ng-content>
            </div>
          }
        </div>
      </div>
    }
  `,
  styleUrl: './base-modal.component.css'
})
export class BaseModalComponent {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  readonly aberto = input<boolean>(false);
  readonly titulo = input<string>('');
  readonly tamanho = input<'pequeno' | 'medio' | 'grande'>('medio');
  
  readonly tamanhoClass = computed(() => this.tamanho());
  readonly fecharOverlay = input<boolean>(true);
  readonly mostrarFooter = input<boolean>(true);

  readonly onFechar = output<void>();

  constructor() {
    // Effect para controlar overflow do body quando modal abrir/fechar
    // Deve estar no injection context (constructor)
    if (this.isBrowser) {
      effect(() => {
        if (this.aberto()) {
          document.body.style.overflow = 'hidden';
        } else {
          document.body.style.overflow = '';
        }
      });
    }
  }

  fechar(): void {
    this.onFechar.emit();
  }

  fecharPorOverlay(): void {
    if (this.fecharOverlay()) {
      this.fechar();
    }
  }
}

