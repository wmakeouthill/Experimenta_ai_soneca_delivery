import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Categoria } from '../../../../services/categoria.service';

@Component({
  selector: 'app-menu-contexto-categoria',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './menu-contexto-categoria.component.html',
  styleUrl: './menu-contexto-categoria.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MenuContextoCategoriaComponent {
  readonly aberto = input.required<boolean>();
  readonly posicao = input<{ x: number; y: number } | null>(null);
  readonly categoria = input<Categoria | null>(null);
  readonly isAdmin = input<boolean>(false);

  readonly onFechar = output<void>();
  readonly onEditar = output<Categoria>();
  readonly onExcluir = output<string>();

  fechar(): void {
    this.onFechar.emit();
  }

  editar(): void {
    const categoria = this.categoria();
    if (categoria) {
      this.onEditar.emit(categoria);
    }
    this.fechar();
  }

  excluir(): void {
    const categoria = this.categoria();
    if (categoria) {
      this.onExcluir.emit(categoria.id);
    }
    this.fechar();
  }
}

