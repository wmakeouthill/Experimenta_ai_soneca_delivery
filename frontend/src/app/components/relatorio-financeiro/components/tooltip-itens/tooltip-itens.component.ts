import { ChangeDetectionStrategy, Component, input, signal, HostListener, ElementRef, ViewChild, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormatoUtil } from '../../../../utils/formato.util';
import { ItemPedido } from '../../../../services/pedido.service';
import { TooltipManagerService } from '../../services/tooltip-manager.service';

@Component({
  selector: 'app-tooltip-itens',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tooltip-itens.component.html',
  styleUrl: './tooltip-itens.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TooltipItensComponent {
  private readonly tooltipManager = inject(TooltipManagerService);
  private readonly tooltipId = `tooltip-itens-${Math.random().toString(36).substring(2, 11)}`;

  readonly itens = input.required<ItemPedido[]>();
  readonly aberto = signal<boolean>(false);

  @ViewChild('tooltip', { static: false }) tooltipRef?: ElementRef<HTMLElement>;
  @ViewChild('link', { static: false }) linkRef?: ElementRef<HTMLElement>;

  constructor() {
    effect(() => {
      const tooltipAbertoId = this.tooltipManager.getTooltipAbertoId()();
      this.aberto.set(tooltipAbertoId === this.tooltipId);
    }, { allowSignalWrites: true });
  }

  formatarMoeda(valor: number): string {
    return FormatoUtil.moeda(valor);
  }

  toggleTooltip(event: Event): void {
    event.stopPropagation();
    const estavaAberto = this.aberto();

    if (estavaAberto) {
      this.tooltipManager.fecharTodos();
    } else {
      this.tooltipManager.abrirTooltip(this.tooltipId);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          this.posicionarTooltip();
        });
      });
    }
  }

  posicionarTooltip(): void {
    if (!this.tooltipRef?.nativeElement || !this.linkRef?.nativeElement) return;

    const tooltip = this.tooltipRef.nativeElement;
    const link = this.linkRef.nativeElement;
    const linkRect = link.getBoundingClientRect();

    const DISTANCIA_VERTICAL = 6;
    const centroLink = linkRect.left + (linkRect.width / 2);

    tooltip.style.visibility = 'visible';
    tooltip.style.opacity = '0';
    tooltip.style.left = `${centroLink}px`;
    tooltip.style.top = '0px';

    const tooltipRect = tooltip.getBoundingClientRect();
    const top = linkRect.top - tooltipRect.height - DISTANCIA_VERTICAL;

    tooltip.style.top = `${top}px`;
    tooltip.style.opacity = '1';
  }

  @HostListener('document:click', ['$event'])
  fecharAoClicarFora(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const container = target.closest('.tooltip-itens-container');

    if (!container && this.aberto()) {
      this.tooltipManager.fecharTodos();
    }
  }

  private reposicionarSeAberto(): void {
    if (this.aberto()) {
      this.posicionarTooltip();
    }
  }

  @HostListener('window:scroll', ['$event'])
  aoFazerScroll(): void {
    this.reposicionarSeAberto();
  }

  @HostListener('window:resize', ['$event'])
  aoRedimensionar(): void {
    this.reposicionarSeAberto();
  }
}

