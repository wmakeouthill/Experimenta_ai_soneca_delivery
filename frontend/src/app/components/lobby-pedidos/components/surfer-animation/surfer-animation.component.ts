import { Component, input, ElementRef, ViewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-surfer-animation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './surfer-animation.component.html',
  styleUrl: './surfer-animation.component.css'
})
export class SurferAnimationComponent {
  readonly isModoGestor = input<boolean>(false);
  readonly isAnimating = input<boolean>(false);

  @ViewChild('hamburguerContainer', { static: false }) hamburguerContainer!: ElementRef<HTMLElement>;

  constructor() {
    effect(() => {
      if (this.hamburguerContainer?.nativeElement && this.isAnimating()) {
        this.animarTransicao();
      } else if (this.hamburguerContainer?.nativeElement && !this.isAnimating()) {
        this.resetarAnimacao();
      }
    });
  }

  private animarTransicao() {
    if (!this.hamburguerContainer?.nativeElement) return;

    const container = this.hamburguerContainer.nativeElement;
    const rect = container.getBoundingClientRect();
    const startX = rect.left + rect.width / 2;
    const startY = rect.top + rect.height / 2;

    container.style.position = 'fixed';
    container.style.top = '20px';
    container.style.left = '20px';
    container.style.bottom = '';
    container.style.width = 'auto';
    container.style.padding = '0';
    container.style.margin = '0';
    container.style.zIndex = '10001';
    container.style.opacity = '0.6';

    requestAnimationFrame(() => {
      const endRect = container.getBoundingClientRect();
      const endX = endRect.left + endRect.width / 2;
      const endY = endRect.top + endRect.height / 2;

      const deltaX = startX - endX;
      const deltaY = startY - endY;

      container.style.transform = `translate(${deltaX}px, ${deltaY}px)`;

      requestAnimationFrame(() => {
        container.style.transition = 'transform 1.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 1.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
        container.style.transform = 'translate(0, 0)';
        container.style.opacity = '0.6';
      });
    });
  }

  private resetarAnimacao() {
    if (!this.hamburguerContainer?.nativeElement) return;

    const container = this.hamburguerContainer.nativeElement;
    container.style.position = '';
    container.style.bottom = '';
    container.style.left = '';
    container.style.width = '';
    container.style.padding = '';
    container.style.margin = '';
    container.style.zIndex = '';
    container.style.transform = '';
    container.style.transition = '';
    container.style.opacity = '';
  }
}

