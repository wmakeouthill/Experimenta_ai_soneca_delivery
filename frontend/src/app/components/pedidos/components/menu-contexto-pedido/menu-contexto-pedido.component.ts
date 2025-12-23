import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatusPedido, Pedido } from '../../../../services/pedido.service';

@Component({
  selector: 'app-menu-contexto-pedido',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './menu-contexto-pedido.component.html',
  styleUrl: './menu-contexto-pedido.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MenuContextoPedidoComponent {
  readonly aberto = input.required<boolean>();
  readonly posicao = input<{ x: number; y: number } | null>(null);
  readonly pedido = input<Pedido | null>(null);
  readonly onFechar = output<void>();
  readonly onStatusAlterado = output<{ pedidoId: string; novoStatus: StatusPedido }>();
  readonly onCancelar = output<string>();
  readonly onImprimirSegundaVia = output<string>();

  readonly StatusPedido = StatusPedido;

  obterStatusDisponiveis(statusAtual: StatusPedido): StatusPedido[] {
    const todosStatus = [
      StatusPedido.PENDENTE,
      StatusPedido.PREPARANDO,
      StatusPedido.PRONTO,
      StatusPedido.SAIU_PARA_ENTREGA,
      StatusPedido.FINALIZADO
    ];
    // CANCELADO não pode ser alterado (regra de negócio)
    // FINALIZADO não pode ser alterado para outros status, mas pode ser cancelado
    if (statusAtual === StatusPedido.CANCELADO) {
      return [];
    }
    // FINALIZADO não pode ser alterado para outros status, mas pode ser cancelado
    if (statusAtual === StatusPedido.FINALIZADO) {
      return [];
    }
    return todosStatus.filter(s => s !== statusAtual);
  }

  podeCancelar(statusAtual: StatusPedido): boolean {
    // Permite cancelar pedidos finalizados para casos especiais
    return statusAtual !== StatusPedido.CANCELADO;
  }

  cancelarPedido(): void {
    const pedido = this.pedido();
    if (pedido) {
      this.onCancelar.emit(pedido.id);
    }
    this.fechar();
  }

  obterNomeStatus(status: StatusPedido): string {
    const nomes: Record<StatusPedido, string> = {
      [StatusPedido.PENDENTE]: 'Aguardando',
      [StatusPedido.PREPARANDO]: 'Preparando',
      [StatusPedido.PRONTO]: 'Pronto',
      [StatusPedido.SAIU_PARA_ENTREGA]: 'Saiu p/ Entrega',
      [StatusPedido.FINALIZADO]: 'Finalizado',
      [StatusPedido.CANCELADO]: 'Cancelado'
    };
    return nomes[status] || status;
  }

  alterarStatus(novoStatus: StatusPedido): void {
    const pedido = this.pedido();
    if (pedido) {
      this.onStatusAlterado.emit({ pedidoId: pedido.id, novoStatus });
    }
    this.fechar();
  }

  fechar(): void {
    this.onFechar.emit();
  }

  imprimirSegundaVia(): void {
    const pedido = this.pedido();
    if (pedido) {
      this.onImprimirSegundaVia.emit(pedido.id);
    }
    this.fechar();
  }
}

