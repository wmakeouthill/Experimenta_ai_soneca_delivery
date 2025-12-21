import { Component, inject, input, output, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MesaInfo } from '../../composables/use-mesa';
import { UseIdentificacaoClienteReturn } from '../../composables/use-identificacao-cliente';

@Component({
    selector: 'app-identificacao-screen',
    standalone: true,
    imports: [FormsModule],
    templateUrl: './identificacao-screen.component.html',
    styleUrl: './identificacao-screen.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class IdentificacaoScreenComponent {
    readonly mesa = input.required<MesaInfo>();
    readonly identificacao = input.required<UseIdentificacaoClienteReturn>();
    readonly telefoneValue = input.required<string>();

    readonly telefoneChange = output<string>();
    readonly buscarCliente = output<void>();
}
