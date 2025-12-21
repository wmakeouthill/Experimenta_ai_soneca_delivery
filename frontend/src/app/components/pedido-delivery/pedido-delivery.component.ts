import { Component, inject, signal, computed, OnInit, OnDestroy, ChangeDetectionStrategy, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, interval, switchMap, catchError, of } from 'rxjs';
import {
    DeliveryService,
    TipoPedido,
    ClientePublico,
    CriarPedidoDeliveryRequest,
    ItemPedidoDeliveryRequest,
    StatusPedidoDelivery
} from '../../services/delivery.service';
import { Produto } from '../../services/produto.service';
import { Categoria } from '../../services/categoria.service';
import { AdicionalService, AdicionalProduto } from '../../services/adicional.service';

type Etapa = 'identificacao' | 'cadastro' | 'cardapio' | 'carrinho' | 'checkout' | 'sucesso';

interface ItemCarrinho {
    produto: Produto;
    quantidade: number;
    observacao?: string;
    adicionais?: { adicional: AdicionalProduto; quantidade: number }[];
}

type MeioPagamento = 'PIX' | 'CARTAO_CREDITO' | 'CARTAO_DEBITO' | 'VALE_REFEICAO' | 'DINHEIRO';

@Component({
    selector: 'app-pedido-delivery',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './pedido-delivery.component.html',
    styleUrls: ['./pedido-delivery.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PedidoDeliveryComponent implements OnInit, OnDestroy {
    private readonly deliveryService = inject(DeliveryService);
    private readonly adicionalService = inject(AdicionalService);
    private readonly platformId = inject(PLATFORM_ID);
    private readonly isBrowser = isPlatformBrowser(this.platformId);
    private readonly destroy$ = new Subject<void>();

    protected readonly Math = Math;

    // Estado geral
    readonly carregando = signal(true);
    readonly erro = signal<string | null>(null);
    readonly etapaAtual = signal<Etapa>('identificacao');
    readonly enviando = signal(false);

    // Cliente
    readonly telefone = signal('');
    readonly nome = signal('');
    readonly buscandoCliente = signal(false);
    readonly clienteIdentificado = signal<ClientePublico | null>(null);

    // Tipo de pedido (delivery ou retirada)
    readonly tipoPedido = signal<TipoPedido>('DELIVERY');
    readonly enderecoEntrega = signal('');
    readonly previsaoCliente = signal(''); // Tempo estimado pelo cliente

    // Cardápio
    readonly categorias = signal<Categoria[]>([]);
    readonly produtos = signal<Produto[]>([]);
    readonly categoriaSelecionada = signal<string | null>(null);

    // Carrinho
    readonly itensCarrinho = signal<ItemCarrinho[]>([]);
    readonly mostrarCarrinho = signal(false);

    // Detalhes do produto
    readonly produtoSelecionado = signal<Produto | null>(null);
    readonly quantidadeSelecionada = signal(1);
    readonly observacaoItem = signal('');
    readonly mostrarDetalhes = signal(false);
    readonly adicionaisDisponiveis = signal<AdicionalProduto[]>([]);
    readonly adicionaisSelecionados = signal<{ adicional: AdicionalProduto; quantidade: number }[]>([]);
    readonly carregandoAdicionais = signal(false);

    // Pagamento
    readonly meioPagamentoSelecionado = signal<MeioPagamento | null>(null);

    // Sucesso
    readonly pedidoId = signal<string | null>(null);
    readonly statusPedido = signal<StatusPedidoDelivery | null>(null);

    // Computed
    readonly telefoneValido = computed(() => {
        const tel = this.telefone().replace(/\D/g, '');
        return tel.length >= 10 && tel.length <= 11;
    });

    readonly nomeValido = computed(() => {
        return this.nome().trim().length >= 2;
    });

    readonly podeBuscarCliente = computed(() =>
        this.telefoneValido() && !this.buscandoCliente()
    );

    readonly podeCadastrar = computed(() =>
        this.telefoneValido() && this.nomeValido() && !this.buscandoCliente()
    );

    readonly produtosFiltrados = computed(() => {
        const cat = this.categoriaSelecionada();
        if (!cat) return this.produtos();
        return this.produtos().filter(p => p.categoria === cat);
    });

    readonly totalCarrinho = computed(() => {
        return this.itensCarrinho().reduce((acc, item) => {
            let itemTotal = item.produto.preco * item.quantidade;
            if (item.adicionais) {
                itemTotal += item.adicionais.reduce(
                    (adAcc, ad) => adAcc + ad.adicional.preco * ad.quantidade * item.quantidade,
                    0
                );
            }
            return acc + itemTotal;
        }, 0);
    });

    readonly quantidadeItensCarrinho = computed(() =>
        this.itensCarrinho().reduce((acc, item) => acc + item.quantidade, 0)
    );

    readonly carrinhoVazio = computed(() => this.itensCarrinho().length === 0);

    readonly podeEnviarPedido = computed(() => {
        if (this.carrinhoVazio()) return false;
        if (!this.meioPagamentoSelecionado()) return false;
        if (this.tipoPedido() === 'DELIVERY' && !this.enderecoEntrega().trim()) return false;
        return true;
    });

    readonly enderecoObrigatorio = computed(() => this.tipoPedido() === 'DELIVERY');

    // Lifecycle
    ngOnInit(): void {
        this.carregarCardapio();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    // Métodos de identificação
    formatarTelefone(valor: string): string {
        const numeros = valor.replace(/\D/g, '');
        if (numeros.length <= 2) return numeros;
        if (numeros.length <= 7) return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
        if (numeros.length <= 11) return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
        return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7, 11)}`;
    }

    onTelefoneChange(event: Event): void {
        const input = event.target as HTMLInputElement;
        const formatted = this.formatarTelefone(input.value);
        this.telefone.set(formatted);
    }

    buscarCliente(): void {
        if (!this.podeBuscarCliente()) return;

        this.buscandoCliente.set(true);
        this.erro.set(null);

        const telefone = this.telefone().replace(/\D/g, '');

        this.deliveryService.buscarClientePorTelefone(telefone).subscribe({
            next: (cliente) => {
                this.buscandoCliente.set(false);
                this.clienteIdentificado.set(cliente);
                this.etapaAtual.set('cardapio');
            },
            error: (err) => {
                this.buscandoCliente.set(false);
                if (err.status === 404) {
                    // Cliente não encontrado, ir para cadastro
                    this.etapaAtual.set('cadastro');
                } else {
                    this.erro.set('Erro ao buscar cliente. Tente novamente.');
                }
            }
        });
    }

    cadastrarCliente(): void {
        if (!this.podeCadastrar()) return;

        this.buscandoCliente.set(true);
        this.erro.set(null);

        const telefone = this.telefone().replace(/\D/g, '');

        this.deliveryService.cadastrarCliente({
            nome: this.nome().trim(),
            telefone
        }).subscribe({
            next: (cliente) => {
                this.buscandoCliente.set(false);
                this.clienteIdentificado.set(cliente);
                this.etapaAtual.set('cardapio');
            },
            error: () => {
                this.buscandoCliente.set(false);
                this.erro.set('Erro ao cadastrar. Tente novamente.');
            }
        });
    }

    voltarParaIdentificacao(): void {
        this.nome.set('');
        this.etapaAtual.set('identificacao');
    }

    // Métodos do cardápio
    private carregarCardapio(): void {
        this.carregando.set(true);

        this.deliveryService.buscarCardapio().subscribe({
            next: (cardapio) => {
                this.categorias.set(cardapio.categorias);
                this.produtos.set(cardapio.produtos.filter(p => p.disponivel));
                this.carregando.set(false);
            },
            error: () => {
                this.erro.set('Erro ao carregar cardápio. Tente novamente.');
                this.carregando.set(false);
            }
        });
    }

    selecionarCategoria(categoria: string | null): void {
        this.categoriaSelecionada.set(categoria);
    }

    // Métodos do produto/carrinho
    abrirDetalhesProduto(produto: Produto): void {
        this.produtoSelecionado.set(produto);
        this.quantidadeSelecionada.set(1);
        this.observacaoItem.set('');
        this.adicionaisSelecionados.set([]);
        this.mostrarDetalhes.set(true);
        this.carregarAdicionais(produto.id);
    }

    fecharDetalhes(): void {
        this.mostrarDetalhes.set(false);
        this.produtoSelecionado.set(null);
        this.adicionaisDisponiveis.set([]);
    }

    private carregarAdicionais(produtoId: string): void {
        this.carregandoAdicionais.set(true);
        this.adicionalService.listarAdicionaisDoProduto(produtoId).subscribe({
            next: (adicionais) => {
                this.adicionaisDisponiveis.set(adicionais.filter(a => a.disponivel));
                this.carregandoAdicionais.set(false);
            },
            error: () => {
                this.adicionaisDisponiveis.set([]);
                this.carregandoAdicionais.set(false);
            }
        });
    }

    incrementarQuantidade(): void {
        this.quantidadeSelecionada.update(q => q + 1);
    }

    decrementarQuantidade(): void {
        this.quantidadeSelecionada.update(q => Math.max(1, q - 1));
    }

    toggleAdicional(adicional: AdicionalProduto): void {
        const selecionados = this.adicionaisSelecionados();
        const index = selecionados.findIndex(a => a.adicional.id === adicional.id);

        if (index >= 0) {
            this.adicionaisSelecionados.set(selecionados.filter(a => a.adicional.id !== adicional.id));
        } else {
            this.adicionaisSelecionados.set([...selecionados, { adicional, quantidade: 1 }]);
        }
    }

    isAdicionalSelecionado(adicionalId: string): boolean {
        return this.adicionaisSelecionados().some(a => a.adicional.id === adicionalId);
    }

    adicionarAoCarrinho(): void {
        const produto = this.produtoSelecionado();
        if (!produto) return;

        const novoItem: ItemCarrinho = {
            produto,
            quantidade: this.quantidadeSelecionada(),
            observacao: this.observacaoItem() || undefined,
            adicionais: this.adicionaisSelecionados().length > 0
                ? [...this.adicionaisSelecionados()]
                : undefined
        };

        // Verifica se já existe item igual no carrinho
        const itens = this.itensCarrinho();
        const itemExistente = itens.find(
            i => i.produto.id === produto.id &&
                i.observacao === novoItem.observacao &&
                JSON.stringify(i.adicionais) === JSON.stringify(novoItem.adicionais)
        );

        if (itemExistente) {
            // Incrementa quantidade
            this.itensCarrinho.set(
                itens.map(i =>
                    i === itemExistente
                        ? { ...i, quantidade: i.quantidade + novoItem.quantidade }
                        : i
                )
            );
        } else {
            this.itensCarrinho.set([...itens, novoItem]);
        }

        this.fecharDetalhes();
    }

    removerDoCarrinho(index: number): void {
        const itens = this.itensCarrinho();
        this.itensCarrinho.set(itens.filter((_, i) => i !== index));
    }

    alterarQuantidadeCarrinho(index: number, delta: number): void {
        const itens = this.itensCarrinho();
        const item = itens[index];

        if (!item) return;

        const novaQuantidade = item.quantidade + delta;

        if (novaQuantidade <= 0) {
            this.removerDoCarrinho(index);
        } else {
            this.itensCarrinho.set(
                itens.map((i, idx) =>
                    idx === index ? { ...i, quantidade: novaQuantidade } : i
                )
            );
        }
    }

    abrirCarrinho(): void {
        this.mostrarCarrinho.set(true);
    }

    fecharCarrinho(): void {
        this.mostrarCarrinho.set(false);
    }

    // Checkout
    irParaCheckout(): void {
        if (this.carrinhoVazio()) return;
        this.etapaAtual.set('checkout');
    }

    voltarParaCardapio(): void {
        this.etapaAtual.set('cardapio');
    }

    selecionarMeioPagamento(meio: MeioPagamento): void {
        this.meioPagamentoSelecionado.set(meio);
    }

    selecionarTipoPedido(tipo: TipoPedido): void {
        this.tipoPedido.set(tipo);
        if (tipo === 'RETIRADA') {
            this.enderecoEntrega.set('');
        }
    }

    // Envio do pedido
    enviarPedido(): void {
        const cliente = this.clienteIdentificado();
        if (!cliente || !this.podeEnviarPedido()) return;

        this.enviando.set(true);
        this.erro.set(null);

        const itens: ItemPedidoDeliveryRequest[] = this.itensCarrinho().map(item => ({
            produtoId: item.produto.id,
            quantidade: item.quantidade,
            observacoes: item.observacao,
            adicionais: item.adicionais?.map(ad => ({
                adicionalId: ad.adicional.id,
                quantidade: ad.quantidade
            }))
        }));

        const request: CriarPedidoDeliveryRequest = {
            clienteId: cliente.id,
            nomeCliente: cliente.nome,
            telefoneCliente: cliente.telefone,
            itens,
            meiosPagamento: this.meioPagamentoSelecionado()
                ? [{ meioPagamento: this.meioPagamentoSelecionado()!, valor: this.totalCarrinho() }]
                : undefined,
            tipoPedido: this.tipoPedido(),
            enderecoEntrega: this.tipoPedido() === 'DELIVERY' ? this.enderecoEntrega() : undefined,
            previsaoEntregaCliente: this.previsaoCliente() || undefined
        };

        this.deliveryService.criarPedido(request).subscribe({
            next: (response) => {
                this.enviando.set(false);
                this.pedidoId.set(response.id);
                this.itensCarrinho.set([]);
                this.etapaAtual.set('sucesso');
                this.iniciarPollingStatus(response.id);
            },
            error: () => {
                this.enviando.set(false);
                this.erro.set('Erro ao enviar pedido. Tente novamente.');
            }
        });
    }

    // Polling de status
    private iniciarPollingStatus(pedidoId: string): void {
        interval(5000).pipe(
            takeUntil(this.destroy$),
            switchMap(() => this.deliveryService.buscarStatusPedido(pedidoId)),
            catchError(() => of(null))
        ).subscribe(status => {
            if (status) {
                this.statusPedido.set(status);
            }
        });

        // Busca inicial
        this.deliveryService.buscarStatusPedido(pedidoId).subscribe({
            next: (status) => this.statusPedido.set(status),
            error: () => { }
        });
    }

    novoPedido(): void {
        this.pedidoId.set(null);
        this.statusPedido.set(null);
        this.meioPagamentoSelecionado.set(null);
        this.enderecoEntrega.set('');
        this.previsaoCliente.set('');
        this.etapaAtual.set('cardapio');
    }

    // Formatação
    formatarPreco(valor: number): string {
        return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    getStatusLabel(status: string): string {
        const labels: Record<string, string> = {
            'AGUARDANDO_ACEITACAO': 'Aguardando Confirmação',
            'ACEITO': 'Pedido Aceito',
            'PREPARANDO': 'Preparando',
            'PRONTO': 'Pronto',
            'SAIU_PARA_ENTREGA': 'Saiu para Entrega',
            'ENTREGUE': 'Entregue',
            'FINALIZADO': 'Finalizado',
            'CANCELADO': 'Cancelado'
        };
        return labels[status] || status;
    }

    getStatusIcon(status: string): string {
        const icons: Record<string, string> = {
            'AGUARDANDO_ACEITACAO': '⏳',
            'ACEITO': '✅',
            'PREPARANDO': '👨‍🍳',
            'PRONTO': '🍽️',
            'SAIU_PARA_ENTREGA': '🏍️',
            'ENTREGUE': '📦',
            'FINALIZADO': '🎉',
            'CANCELADO': '❌'
        };
        return icons[status] || '📋';
    }

    calcularPrecoItemCarrinho(item: ItemCarrinho): number {
        let total = item.produto.preco * item.quantidade;
        if (item.adicionais) {
            total += item.adicionais.reduce(
                (acc, ad) => acc + ad.adicional.preco * ad.quantidade * item.quantidade,
                0
            );
        }
        return total;
    }
}
