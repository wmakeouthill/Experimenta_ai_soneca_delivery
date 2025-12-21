import { Component, inject, input, output, signal, computed, ChangeDetectionStrategy, effect, OnDestroy, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { SelecaoClienteComponent } from '../selecao-cliente/selecao-cliente.component';
import { SelecaoProdutosComponent } from '../selecao-produtos/selecao-produtos.component';
import { ItensPedidoComponent } from '../itens-pedido/itens-pedido.component';
import { MeiosPagamentoComponent } from '../meios-pagamento/meios-pagamento.component';
import { ProdutoDetalhesModalComponent, ProdutoComAdicionais } from '../produto-detalhes-modal/produto-detalhes-modal.component';
import { Cliente } from '../../../../services/cliente.service';
import { Produto } from '../../../../services/produto.service';
import { ItemPedidoRequest, MeioPagamentoPedido, ItemPedidoAdicionalRequest } from '../../../../services/pedido.service';

export interface ItemPedidoComAdicionais extends ItemPedidoRequest {
  itemId?: string;
  adicionaisInfo?: { nome: string; quantidade: number; preco: number }[];
}

@Component({
  selector: 'app-novo-pedido-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SelecaoClienteComponent,
    SelecaoProdutosComponent,
    ItensPedidoComponent,
    MeiosPagamentoComponent,
    ProdutoDetalhesModalComponent
  ],
  templateUrl: './novo-pedido-modal.component.html',
  styleUrl: './novo-pedido-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NovoPedidoModalComponent implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private scrollPosition = 0;

  readonly aberto = input.required<boolean>();
  readonly produtos = input.required<Produto[]>();
  readonly onFechar = output<void>();
  readonly onCriarPedido = output<{
    clienteId: string;
    clienteNome: string;
    itens: ItemPedidoRequest[];
    meiosPagamento: MeioPagamentoPedido[];
    observacoes?: string;
  }>();

  readonly clienteSelecionado = signal<Cliente | null>(null);
  readonly itensSelecionados = signal<ItemPedidoComAdicionais[]>([]);
  readonly meiosPagamento = signal<MeioPagamentoPedido[]>([]);

  // Modal de detalhes do produto
  readonly modalDetalhesAberto = signal(false);
  readonly produtoParaDetalhe = signal<Produto | null>(null);

  readonly pedidoForm: FormGroup;

  readonly valorTotal = computed(() => {
    return this.itensSelecionados().reduce((total, item) => {
      const produto = this.produtos().find(p => p.id === item.produtoId);
      if (produto) {
        // Soma preço do produto
        let subtotal = produto.preco * item.quantidade;
        // Soma adicionais
        if (item.adicionaisInfo && item.adicionaisInfo.length > 0) {
          const totalAdicionais = item.adicionaisInfo.reduce((acc, ad) =>
            acc + (ad.preco * ad.quantidade), 0);
          subtotal += totalAdicionais * item.quantidade;
        }
        return total + subtotal;
      }
      return total;
    }, 0);
  });

  readonly valorRestante = computed(() => {
    const total = this.valorTotal();
    const totalMeiosPagamento = this.meiosPagamento().reduce((sum, mp) => sum + mp.valor, 0);
    return total - totalMeiosPagamento;
  });

  constructor() {
    this.pedidoForm = this.fb.group({
      observacoes: ['']
    });

    // Bloqueia o scroll do body quando o modal estiver aberto
    effect(() => {
      if (this.isBrowser) {
        if (this.aberto()) {
          this.bloquearScroll();
        } else {
          this.liberarScroll();
        }
      }
    });
  }

  ngOnDestroy(): void {
    if (this.isBrowser) {
      this.liberarScroll();
    }
  }

  private bloquearScroll(): void {
    if (!this.isBrowser) return;

    // Salva a posição atual do scroll
    this.scrollPosition = window.pageYOffset || document.documentElement.scrollTop;

    // Aplica estilos para bloquear o scroll
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${this.scrollPosition}px`;
    document.body.style.width = '100%';
  }

  private liberarScroll(): void {
    if (!this.isBrowser) return;

    // Remove os estilos de bloqueio
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';

    // Restaura a posição do scroll
    window.scrollTo(0, this.scrollPosition);
  }

  onClienteSelecionado(cliente: Cliente): void {
    this.clienteSelecionado.set(cliente);
  }

  onClienteCriado(cliente: Cliente): void {
    this.clienteSelecionado.set(cliente);
  }

  onTrocarCliente(): void {
    this.clienteSelecionado.set(null);
  }

  onProdutoSelecionado(produto: Produto): void {
    // Abre o modal de detalhes para selecionar quantidade e adicionais
    this.produtoParaDetalhe.set(produto);
    this.modalDetalhesAberto.set(true);
  }

  onFecharModalDetalhes(): void {
    this.modalDetalhesAberto.set(false);
    this.produtoParaDetalhe.set(null);
  }

  onConfirmarProduto(dados: ProdutoComAdicionais): void {
    const novoItem: ItemPedidoComAdicionais = {
      produtoId: dados.produto.id,
      quantidade: dados.quantidade,
      observacoes: dados.observacoes || '',
      itemId: `${dados.produto.id}-${Date.now()}-${Math.random()}`,
      adicionais: dados.adicionais.map(ad => ({
        adicionalId: ad.adicional.id,
        quantidade: ad.quantidade
      })),
      adicionaisInfo: dados.adicionais.map(ad => ({
        nome: ad.adicional.nome,
        quantidade: ad.quantidade,
        preco: ad.adicional.preco
      }))
    };
    this.itensSelecionados.update(lista => [...lista, novoItem]);
    this.onFecharModalDetalhes();
  }

  onQuantidadeAlterada(event: { index: number; quantidade: number }): void {
    const itens = this.itensSelecionados();
    itens[event.index].quantidade = event.quantidade;
    this.itensSelecionados.set([...itens]);
  }

  onItemRemovido(index: number): void {
    this.itensSelecionados.update(lista => lista.filter((_, i) => i !== index));
  }

  onMeiosPagamentoChange(meiosPagamento: MeioPagamentoPedido[]): void {
    this.meiosPagamento.set(meiosPagamento);
  }

  fechar(): void {
    this.onFechar.emit();
    this.resetar();
  }

  criarPedido(): void {
    const cliente = this.clienteSelecionado();
    if (!cliente || this.itensSelecionados().length === 0 || this.meiosPagamento().length === 0) {
      return;
    }

    const request: {
      clienteId: string;
      clienteNome: string;
      itens: any[];
      meiosPagamento: MeioPagamentoPedido[];
      observacoes?: string;
    } = {
      clienteId: cliente.id,
      clienteNome: cliente.nome,
      itens: this.itensSelecionados().map(item => {
        const itemRequest: any = {
          produtoId: item.produtoId,
          quantidade: item.quantidade
        };
        if (item.observacoes?.trim()) {
          itemRequest.observacoes = item.observacoes.trim();
        }
        // Inclui adicionais se houver
        if (item.adicionais && item.adicionais.length > 0) {
          itemRequest.adicionais = item.adicionais;
        }
        return itemRequest;
      }),
      meiosPagamento: this.meiosPagamento()
    };

    if (this.pedidoForm.value.observacoes?.trim()) {
      request.observacoes = this.pedidoForm.value.observacoes.trim();
    }

    this.onCriarPedido.emit(request);
    this.resetar();
  }

  private resetar(): void {
    this.clienteSelecionado.set(null);
    this.itensSelecionados.set([]);
    this.meiosPagamento.set([]);
    this.pedidoForm.reset();
  }

  podeCriarPedido(): boolean {
    return !!this.clienteSelecionado() &&
      this.itensSelecionados().length > 0 &&
      this.meiosPagamento().length > 0 &&
      this.valorRestante() <= 0.01;
  }
}

