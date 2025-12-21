import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      @for (notificacao of notificationService.notificacoes(); track notificacao.id) {
        <div 
          class="toast" 
          [class.sucesso]="notificacao.tipo === 'sucesso'"
          [class.erro]="notificacao.tipo === 'erro'"
          [class.info]="notificacao.tipo === 'info'"
          [class.aviso]="notificacao.tipo === 'aviso'"
          (click)="notificationService.remover(notificacao.id)"
        >
          <span class="toast-icon">
            @switch (notificacao.tipo) {
              @case ('sucesso') { ✅ }
              @case ('erro') { ❌ }
              @case ('info') { ℹ️ }
              @case ('aviso') { ⚠️ }
            }
          </span>
          <span class="toast-message">{{ notificacao.mensagem }}</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none; /* Permite clicar através do container */
    }

    .toast {
      pointer-events: auto; /* Reativa cliques no toast */
      min-width: 300px;
      max-width: 450px;
      padding: 16px;
      border-radius: 8px;
      background: white;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      display: flex;
      align-items: center;
      gap: 12px;
      animation: slideIn 0.3s ease-out;
      cursor: pointer;
      border-left: 4px solid #ccc;
      font-family: 'Inter', sans-serif;
      font-size: 14px;
      line-height: 1.4;
    }

    .toast.sucesso { border-left-color: #10b981; background: #ecfdf5; color: #065f46; }
    .toast.erro { border-left-color: #ef4444; background: #fef2f2; color: #991b1b; }
    .toast.info { border-left-color: #3b82f6; background: #eff6ff; color: #1e40af; }
    .toast.aviso { border-left-color: #f59e0b; background: #fffbeb; color: #92400e; }

    .toast-icon { font-size: 18px; }
    .toast-message { flex: 1; }

    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `]
})
export class ToastComponent {
  readonly notificationService = inject(NotificationService);
}
