import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { UseSucessoPedidoReturn } from '../../composables/use-sucesso-pedido';

/**
 * Componente que exibe a tela de acompanhamento do pedido.
 * Mostra timeline de status, informações da mesa e ações disponíveis.
 *
 * @example
 * <app-sucesso-screen
 *   [sucesso]="sucesso"
 *   [mesaNumero]="mesa()?.numero"
 *   (continuarNavegando)="continuarNavegando()"
 *   (novoPedido)="novoPedido()"
 * />
 */
@Component({
    selector: 'app-sucesso-screen',
    standalone: true,
    imports: [],
    templateUrl: './sucesso-screen.component.html',
    styleUrl: './sucesso-screen.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SucessoScreenComponent {
    /** Composable com estado do pedido */
    readonly sucesso = input.required<UseSucessoPedidoReturn>();

    /** Número da mesa */
    readonly mesaNumero = input<string | number>();

    /** Emitido quando usuário quer minimizar e continuar navegando */
    readonly continuarNavegando = output<void>();

    /** Emitido quando usuário quer fazer novo pedido */
    readonly novoPedido = output<void>();
}
