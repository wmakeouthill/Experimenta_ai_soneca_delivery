import { Component, input, output, ChangeDetectionStrategy, computed } from '@angular/core';

export type AbaNavegacao = 'inicio' | 'cardapio' | 'perfil';

/**
 * Footer de navegação entre abas do cardápio.
 * Exibe botões para Início, Cardápio e Perfil.
 *
 * @example
 * <app-cardapio-footer-nav
 *   [abaAtual]="abaAtual()"
 *   [totalCarrinho]="carrinho.totalQuantidade()"
 *   [temPedidoAtivo]="temPedidoAtivo()"
 *   (abaMudou)="abaAtual.set($event)"
 *   (abrirCarrinho)="abrirCarrinho()"
 * />
 */
@Component({
    selector: 'app-cardapio-footer-nav',
    standalone: true,
    imports: [],
    templateUrl: './cardapio-footer-nav.component.html',
    styleUrl: './cardapio-footer-nav.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardapioFooterNavComponent {
    /** Aba atualmente selecionada */
    readonly abaAtual = input.required<AbaNavegacao>();

    /** Total de itens no carrinho */
    readonly totalCarrinho = input<number>(0);

    /** Se tem pedido ativo sendo acompanhado */
    readonly temPedidoAtivo = input<boolean>(false);

    /** Emitido quando aba muda */
    readonly abaMudou = output<AbaNavegacao>();

    /** Emitido quando clica para abrir carrinho */
    readonly abrirCarrinho = output<void>();

    readonly temItensCarrinho = computed(() => (this.totalCarrinho() ?? 0) > 0);
}
