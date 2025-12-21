import { Directive, ElementRef, OnInit, OnDestroy, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Diretiva que adiciona scroll horizontal por drag (arrastar) em elementos.
 * Útil para carrosséis em dispositivos touch e desktop.
 *
 * Uso: <div class="carrossel-horizontal" appDraggableScroll>
 */
@Directive({
    selector: '[appDraggableScroll]',
    standalone: true
})
export class DraggableScrollDirective implements OnInit, OnDestroy {
    private readonly el = inject(ElementRef);
    private readonly platformId = inject(PLATFORM_ID);

    private isDown = false;
    private startX = 0;
    private scrollLeft = 0;
    private moved = false;

    // Bound handlers for proper removal
    private boundMouseDown = this.onMouseDown.bind(this);
    private boundMouseLeave = this.onMouseLeave.bind(this);
    private boundMouseUp = this.onMouseUp.bind(this);
    private boundMouseMove = this.onMouseMove.bind(this);
    private boundClick = this.onClick.bind(this);
    private boundTouchStart = this.onTouchStart.bind(this);
    private boundTouchEnd = this.onTouchEnd.bind(this);
    private boundTouchMove = this.onTouchMove.bind(this);

    ngOnInit(): void {
        if (!isPlatformBrowser(this.platformId)) return;

        const element = this.el.nativeElement as HTMLElement;

        // Mouse events (desktop)
        element.addEventListener('mousedown', this.boundMouseDown);
        element.addEventListener('mouseleave', this.boundMouseLeave);
        element.addEventListener('mouseup', this.boundMouseUp);
        element.addEventListener('mousemove', this.boundMouseMove);
        element.addEventListener('click', this.boundClick, true);

        // Touch events (mobile) - para melhor resposta
        element.addEventListener('touchstart', this.boundTouchStart, { passive: true });
        element.addEventListener('touchend', this.boundTouchEnd);
        element.addEventListener('touchmove', this.boundTouchMove, { passive: false });

        // Estilo de cursor
        element.style.cursor = 'grab';
    }

    ngOnDestroy(): void {
        if (!isPlatformBrowser(this.platformId)) return;

        const element = this.el.nativeElement as HTMLElement;

        element.removeEventListener('mousedown', this.boundMouseDown);
        element.removeEventListener('mouseleave', this.boundMouseLeave);
        element.removeEventListener('mouseup', this.boundMouseUp);
        element.removeEventListener('mousemove', this.boundMouseMove);
        element.removeEventListener('click', this.boundClick, true);
        element.removeEventListener('touchstart', this.boundTouchStart);
        element.removeEventListener('touchend', this.boundTouchEnd);
        element.removeEventListener('touchmove', this.boundTouchMove);
    }

    // ========== MOUSE EVENTS ==========

    private onMouseDown(e: MouseEvent): void {
        const element = this.el.nativeElement as HTMLElement;
        this.isDown = true;
        this.moved = false;
        element.style.cursor = 'grabbing';
        this.startX = e.pageX - element.offsetLeft;
        this.scrollLeft = element.scrollLeft;
    }

    private onMouseLeave(): void {
        this.isDown = false;
        const element = this.el.nativeElement as HTMLElement;
        element.style.cursor = 'grab';
    }

    private onMouseUp(): void {
        this.isDown = false;
        const element = this.el.nativeElement as HTMLElement;
        element.style.cursor = 'grab';
    }

    private onMouseMove(e: MouseEvent): void {
        if (!this.isDown) return;
        e.preventDefault();

        const element = this.el.nativeElement as HTMLElement;
        const x = e.pageX - element.offsetLeft;
        const walk = (x - this.startX) * 1.5; // Multiplicador de velocidade

        if (Math.abs(walk) > 5) {
            this.moved = true;
        }

        element.scrollLeft = this.scrollLeft - walk;
    }

    private onClick(e: MouseEvent): void {
        // Previne cliques quando o usuário estava arrastando
        if (this.moved) {
            e.preventDefault();
            e.stopPropagation();
            this.moved = false;
        }
    }

    // ========== TOUCH EVENTS ==========

    private onTouchStart(e: TouchEvent): void {
        const element = this.el.nativeElement as HTMLElement;
        this.isDown = true;
        this.moved = false;
        this.startX = e.touches[0].pageX - element.offsetLeft;
        this.scrollLeft = element.scrollLeft;
    }

    private onTouchEnd(): void {
        this.isDown = false;
    }

    private onTouchMove(e: TouchEvent): void {
        if (!this.isDown) return;

        const element = this.el.nativeElement as HTMLElement;
        const x = e.touches[0].pageX - element.offsetLeft;
        const walk = (x - this.startX) * 1.2;

        if (Math.abs(walk) > 10) {
            this.moved = true;
            // Previne scroll vertical enquanto arrasta horizontalmente
            e.preventDefault();
        }

        element.scrollLeft = this.scrollLeft - walk;
    }
}
