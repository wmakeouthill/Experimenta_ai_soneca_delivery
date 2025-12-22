import { Component, input, output, ChangeDetectionStrategy, computed } from '@angular/core';

export type AbaDelivery = 'inicio' | 'cardapio' | 'carrinho' | 'perfil';

/**
 * Footer de navegação entre abas do delivery.
 * Exibe botões para Início, Cardápio, Carrinho e Perfil.
 *
 * @example
 * <app-footer-nav
 *   [abaAtual]="abaAtual()"
 *   [totalCarrinho]="quantidadeItensCarrinho()"
 *   (abaMudou)="abaAtual.set($event)"
 *   (abrirCarrinho)="abrirCarrinho()"
 * />
 */
@Component({
    selector: 'app-footer-nav',
    standalone: true,
    imports: [],
    templateUrl: './footer-nav.component.html',
    styleUrl: './footer-nav.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FooterNavComponent {
    /** Aba atualmente selecionada */
    readonly abaAtual = input.required<AbaDelivery>();

    /** Total de itens no carrinho */
    readonly totalCarrinho = input<number>(0);

    /** Emitido quando aba muda */
    readonly abaMudou = output<AbaDelivery>();

    /** Emitido quando clica para abrir carrinho */
    readonly abrirCarrinho = output<void>();

    readonly temItensCarrinho = computed(() => (this.totalCarrinho() ?? 0) > 0);
}
