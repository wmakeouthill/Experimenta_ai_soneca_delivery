import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Botão flutuante para abrir o Chat IA.
 * Exibe o ícone do Soneca com indicador de disponibilidade.
 */
@Component({
    selector: 'app-chat-ia-button',
    standalone: true,
    imports: [CommonModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    <button 
      class="chat-ia-btn" 
      [class.pulse]="pulse()"
      (click)="onClick.emit()"
      [attr.aria-label]="'Abrir chat com Soneca IA'">
      <img 
        src="/assets/soneca_ai.webp" 
        alt="Soneca IA" 
        class="chat-ia-btn-icon"
        loading="eager"
        decoding="async"
        fetchpriority="high">
      <span class="chat-ia-tooltip">Fale comigo! 💬</span>
    </button>
  `,
    styles: [`
    :host {
      --espacamento: 1rem;
      --footer-altura: 70px;
    }

    .chat-ia-btn {
      position: fixed;
      bottom: calc(var(--footer-altura) + var(--espacamento));
      right: var(--espacamento);
      width: 100px;
      height: 100px;
      border-radius: 50%;
      background: transparent;
      border: none;
      box-shadow: 0 4px 25px rgba(255, 107, 53, 0.5);
      cursor: pointer;
      z-index: 9990;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      overflow: visible;
      padding: 0;
    }

    .chat-ia-btn:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 35px rgba(255, 107, 53, 0.7);
    }

    .chat-ia-btn:active {
      transform: scale(0.95);
    }

    .chat-ia-btn.pulse {
      animation: pulse 2.5s infinite ease-in-out;
    }

    @keyframes pulse {
      0%, 100% {
        box-shadow: 0 4px 25px rgba(255, 107, 53, 0.5);
      }
      50% {
        box-shadow: 0 6px 40px rgba(255, 107, 53, 0.8);
      }
    }

    .chat-ia-btn-icon {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      object-fit: contain;
    }

    .chat-ia-tooltip {
      position: absolute;
      right: calc(100% + 0.75rem);
      top: 50%;
      transform: translateY(-50%);
      background: linear-gradient(135deg, #FF6B35 0%, #e85d27 100%);
      color: white;
      padding: 0.6rem 1rem;
      border-radius: 12px;
      font-size: 0.9rem;
      font-weight: 600;
      white-space: nowrap;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.2s ease, visibility 0.2s ease, transform 0.2s ease;
      box-shadow: 0 4px 15px rgba(255, 107, 53, 0.4);
      pointer-events: none;
    }

    .chat-ia-tooltip::after {
      content: '';
      position: absolute;
      right: -8px;
      top: 50%;
      transform: translateY(-50%);
      border: 8px solid transparent;
      border-left-color: #FF6B35;
    }

    .chat-ia-btn:hover .chat-ia-tooltip {
      opacity: 1;
      visibility: visible;
      transform: translateY(-50%) translateX(-5px);
    }

    /* Responsivo - tablets */
    @media (max-width: 768px) {
      .chat-ia-btn {
        width: 88px;
        height: 88px;
      }

      .chat-ia-btn-icon {
        width: 88px;
        height: 88px;
      }

      .chat-ia-tooltip {
        display: none;
      }
    }

    /* Responsivo - mobile */
    @media (max-width: 480px) {
      .chat-ia-btn {
        width: 80px;
        height: 80px;
      }

      .chat-ia-btn-icon {
        width: 80px;
        height: 80px;
      }
    }

    /* Safe area para iPhones com notch */
    @supports (padding-bottom: env(safe-area-inset-bottom)) {
      .chat-ia-btn {
        bottom: calc(var(--footer-altura) + var(--espacamento) + env(safe-area-inset-bottom));
      }
    }
  `]
})
export class ChatIAButtonComponent {
    readonly pulse = input<boolean>(true);
    readonly onClick = output<void>();
}
