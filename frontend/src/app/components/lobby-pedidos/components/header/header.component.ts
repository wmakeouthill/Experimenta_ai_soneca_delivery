import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-lobby-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class LobbyHeaderComponent {
  readonly isAnimating = input<boolean>(false);
  readonly isModoGestor = input<boolean>(false);
  readonly podeConfigurarAnimacao = input<boolean>(true);
  readonly onTrocarModo = output<void>();
  readonly onAnimacaoManual = output<void>();
  readonly onAbrirConfig = output<void>();

  handleTrocarModo() {
    this.onTrocarModo.emit();
  }

  handleAnimacaoManual() {
    this.onAnimacaoManual.emit();
  }

  handleAbrirConfig() {
    this.onAbrirConfig.emit();
  }
}

