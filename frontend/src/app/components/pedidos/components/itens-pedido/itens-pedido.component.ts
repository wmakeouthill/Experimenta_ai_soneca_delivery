import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ItemPedidoRequest } from '../../../../services/pedido.service';
import { Produto } from '../../../../services/produto.service';

interface ItemPedidoComAdicionais extends ItemPedidoRequest {
  itemId?: string;
  adicionaisInfo?: { nome: string; quantidade: number; preco: number }[];
}

@Component({
  selector: 'app-itens-pedido',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './itens-pedido.component.html',
  styleUrl: './itens-pedido.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ItensPedidoComponent {
  readonly itens = input.required<ItemPedidoComAdicionais[]>();
  readonly produtos = input.required<Produto[]>();
  readonly onQuantidadeAlterada = output<{ index: number; quantidade: number }>();
  readonly onItemRemovido = output<number>();

  buscarProdutoPorId(produtoId: string): Produto | undefined {
    return this.produtos().find(p => p.id === produtoId);
  }

  calcularSubtotalItem(item: ItemPedidoComAdicionais): number {
    const produto = this.buscarProdutoPorId(item.produtoId);
    if (produto) {
      let subtotal = produto.preco * item.quantidade;
      // Soma adicionais
      if (item.adicionaisInfo && item.adicionaisInfo.length > 0) {
        const totalAdicionais = item.adicionaisInfo.reduce((acc, ad) =>
          acc + (ad.preco * ad.quantidade), 0);
        subtotal += totalAdicionais * item.quantidade;
      }
      return subtotal;
    }
    return 0;
  }

  calcularTotal(): number {
    return this.itens().reduce((total, item) => {
      return total + this.calcularSubtotalItem(item);
    }, 0);
  }

  obterItemId(item: ItemPedidoComAdicionais): string {
    return item.itemId || item.produtoId;
  }

  obterAdicionaisInfo(item: ItemPedidoComAdicionais): { nome: string; quantidade: number; preco: number }[] {
    return item.adicionaisInfo || [];
  }

  atualizarQuantidade(index: number, quantidade: number): void {
    if (quantidade <= 0) {
      this.onItemRemovido.emit(index);
    } else {
      this.onQuantidadeAlterada.emit({ index, quantidade });
    }
  }

  removerItem(index: number): void {
    this.onItemRemovido.emit(index);
  }

  formatarPreco(preco: number): string {
    return `R$ ${preco.toFixed(2).replace('.', ',')}`;
  }
}

