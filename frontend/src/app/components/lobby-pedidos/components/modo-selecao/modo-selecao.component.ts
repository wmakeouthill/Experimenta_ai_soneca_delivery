import { Component, output } from '@angular/core';
import { CommonModule } from '@angular/common';

type Modo = 'gestor' | 'cliente';

@Component({
  selector: 'app-modo-selecao',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modo-selecao.component.html',
  styleUrl: './modo-selecao.component.css'
})
export class ModoSelecaoComponent {
  readonly onSelecionarModo = output<Modo>();

  selecionarModo(modo: Modo) {
    this.onSelecionarModo.emit(modo);
  }
}

