import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Pedido, StatusPedido } from '../../../../services/pedido.service';
import { FormatoUtil } from '../../../../utils/formato.util';

@Component({
  selector: 'app-order-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './order-card.component.html',
  styleUrl: './order-card.component.css'
})
export class OrderCardComponent {
  readonly pedido = input.required<Pedido>();
  readonly isModoGestor = input<boolean>(false);
  readonly isAnimating = input<boolean>(false);
  readonly pedidoAnimando = input<string | null>(null);
  readonly onMarcarComoPronto = output<string>();
  readonly onRemover = output<string>();

  readonly isPreparando = computed(() => this.pedido().status === StatusPedido.PREPARANDO);
  readonly isPronto = computed(() => this.pedido().status === StatusPedido.PRONTO);
  
  readonly nomeClienteLimitado = computed(() => 
    FormatoUtil.limitarPalavras(this.pedido().clienteNome, 3)
  );
  
  readonly cardClass = computed(() => {
    const classes = ['card-pedido'];
    if (this.isPreparando()) classes.push('preparando');
    if (this.isPronto()) classes.push('pronto');
    if (!this.isModoGestor()) classes.push('modo-visualizacao');
    if (this.pedidoAnimando() === this.pedido().id) {
      classes.push(this.isPreparando() ? 'animando-saida' : 'animando-entrada');
    }
    return classes.join(' ');
  });

  handleMarcarComoPronto() {
    this.onMarcarComoPronto.emit(this.pedido().id);
  }

  handleRemover() {
    this.onRemover.emit(this.pedido().id);
  }
}

