import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-manager-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manager-form.component.html',
  styleUrl: './manager-form.component.css'
})
export class ManagerFormComponent {
  readonly isModoGestor = input<boolean>(false);
  readonly isAnimating = input<boolean>(false);
  readonly loading = input<boolean>(false);
  readonly error = input<string | null>(null);
  readonly onAdicionarPedido = output<string>();

  readonly nomeCliente = signal('');

  handleSubmit() {
    const nome = this.nomeCliente().trim();
    if (nome) {
      this.onAdicionarPedido.emit(nome);
      this.nomeCliente.set('');
    }
  }
}

