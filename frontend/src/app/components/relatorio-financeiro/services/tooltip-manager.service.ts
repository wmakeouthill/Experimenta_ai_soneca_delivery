import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TooltipManagerService {
  private readonly tooltipAbertoId = signal<string | null>(null);

  abrirTooltip(id: string): void {
    this.tooltipAbertoId.set(id);
  }

  fecharTooltip(id: string): void {
    if (this.tooltipAbertoId() === id) {
      this.tooltipAbertoId.set(null);
    }
  }

  estaAberto(id: string): boolean {
    return this.tooltipAbertoId() === id;
  }

  fecharTodos(): void {
    this.tooltipAbertoId.set(null);
  }

  getTooltipAbertoId() {
    return this.tooltipAbertoId.asReadonly();
  }
}

