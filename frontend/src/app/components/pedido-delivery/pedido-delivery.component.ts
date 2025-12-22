import { Component, inject, signal, computed, OnInit, OnDestroy, ChangeDetectionStrategy, PLATFORM_ID, ViewChild, ElementRef, AfterViewInit, AfterViewChecked } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, interval, switchMap, catchError, of, firstValueFrom } from 'rxjs';
import {
    ClienteAuthService,
    ClienteAuth,
    CadastrarClienteDeliveryRequest,
    ClienteLoginRequest
} from '../../services/cliente-auth.service';
import { GoogleSignInService } from '../../services/google-signin.service';
import { DeliveryService, TipoPedido, CriarPedidoDeliveryRequest, ItemPedidoDeliveryRequest, StatusPedidoDelivery } from '../../services/delivery.service';
import { Produto } from '../../services/produto.service';
import { Categoria } from '../../services/categoria.service';
import { AdicionalService, Adicional } from '../../services/adicional.service';

type Etapa = 'boas-vindas' | 'login' | 'cadastro' | 'cardapio' | 'carrinho' | 'checkout' | 'sucesso';

interface ItemCarrinho {
    produto: Produto;
    quantidade: number;
    observacao?: string;
    adicionais?: { adicional: Adicional; quantidade: number }[];
}

type MeioPagamento = 'PIX' | 'CARTAO_CREDITO' | 'CARTAO_DEBITO' | 'VALE_REFEICAO' | 'DINHEIRO';

interface FormCadastro {
    nome: string;
    telefone: string;
    email: string;
    senha: string;
    confirmarSenha: string;
    logradouro: string;
    numero: string;
    complemento: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
    pontoReferencia: string;
}

@Component({
    selector: 'app-pedido-delivery',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './pedido-delivery.component.html',
    styleUrls: ['./pedido-delivery.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PedidoDeliveryComponent implements OnInit, OnDestroy, AfterViewInit, AfterViewChecked {
    private readonly clienteAuthService = inject(ClienteAuthService);
    private readonly googleSignInService = inject(GoogleSignInService);
    private readonly deliveryService = inject(DeliveryService);
    private readonly adicionalService = inject(AdicionalService);
    private readonly platformId = inject(PLATFORM_ID);
    private readonly isBrowser = isPlatformBrowser(this.platformId);
    private readonly destroy$ = new Subject<void>();

    protected readonly Math = Math;

    // Estado geral
    readonly carregando = signal(true);
    readonly erro = signal<string | null>(null);
    readonly etapaAtual = signal<Etapa>('boas-vindas');
    readonly enviando = signal(false);

    // Cliente autenticado
    readonly cliente = signal<ClienteAuth | null>(null);

    // Login
    readonly loginTelefone = signal('');
    readonly loginSenha = signal('');
    readonly loginCarregando = signal(false);

    // Cadastro
    readonly formCadastro = signal<FormCadastro>({
        nome: '',
        telefone: '',
        email: '',
        senha: '',
        confirmarSenha: '',
        logradouro: '',
        numero: '',
        complemento: '',
        bairro: '',
        cidade: '',
        estado: '',
        cep: '',
        pontoReferencia: ''
    });
    readonly cadastroCarregando = signal(false);
    readonly etapaCadastro = signal<'dados' | 'endereco'>('dados');
    readonly buscandoCep = signal(false);

    // Google Auth
    readonly googleIniciado = signal(false);
    private googleButtonRendered = false;
    @ViewChild('googleButtonLogin') googleButtonLoginRef?: ElementRef<HTMLDivElement>;
    @ViewChild('googleButtonCadastro') googleButtonCadastroRef?: ElementRef<HTMLDivElement>;

    // Tipo de pedido
    readonly tipoPedido = signal<TipoPedido>('DELIVERY');
    readonly enderecoEntrega = signal('');

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
    readonly adicionaisDisponiveis = signal<Adicional[]>([]);
    readonly adicionaisSelecionados = signal<{ adicional: Adicional; quantidade: number }[]>([]);
    readonly carregandoAdicionais = signal(false);

    // Pagamento
    readonly meioPagamentoSelecionado = signal<MeioPagamento | null>(null);

    // Sucesso
    readonly pedidoId = signal<string | null>(null);
    readonly statusPedido = signal<StatusPedidoDelivery | null>(null);

    // ========== COMPUTED ==========

    readonly loginValido = computed(() => {
        const tel = this.loginTelefone().replace(/\D/g, '');
        return tel.length >= 10 && this.loginSenha().length >= 6;
    });

    readonly dadosCadastroValidos = computed(() => {
        const form = this.formCadastro();
        const tel = form.telefone.replace(/\D/g, '');
        return (
            form.nome.trim().length >= 2 &&
            tel.length >= 10 &&
            form.senha.length >= 6 &&
            form.senha === form.confirmarSenha
        );
    });

    readonly enderecoCadastroValido = computed(() => {
        const form = this.formCadastro();
        const cep = form.cep.replace(/\D/g, '');
        return (
            form.logradouro.trim().length >= 3 &&
            form.numero.trim().length >= 1 &&
            form.bairro.trim().length >= 2 &&
            form.cidade.trim().length >= 2 &&
            form.estado.length === 2 &&
            cep.length === 8
        );
    });

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

    // ========== LIFECYCLE ==========

    ngOnInit(): void {
        if (this.isBrowser) {
            // Verificar se já está logado
            const clienteLogado = this.clienteAuthService.clienteLogado;
            if (clienteLogado) {
                this.cliente.set(clienteLogado);
                this.etapaAtual.set('cardapio');
                // Usar endereço salvo se disponível
                if (clienteLogado.enderecoFormatado) {
                    this.enderecoEntrega.set(clienteLogado.enderecoFormatado);
                }
            }
            this.carregarCardapio();
            this.inicializarGoogleAuth();
        } else {
            this.carregando.set(false);
        }
    }

    ngAfterViewInit(): void {
        this.renderizarBotaoGoogle();
    }

    ngAfterViewChecked(): void {
        this.renderizarBotaoGoogle();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    // ========== GOOGLE AUTH ==========

    private async inicializarGoogleAuth(): Promise<void> {
        if (!this.isBrowser) return;

        try {
            await this.googleSignInService.initialize();
            this.googleIniciado.set(true);

            // Escutar credenciais do Google
            this.googleSignInService.credential$
                .pipe(takeUntil(this.destroy$))
                .subscribe(async (token) => {
                    await this.processarLoginGoogle(token);
                });
        } catch (e) {
            console.error('Erro ao inicializar Google Sign-In:', e);
        }
    }

    private renderizarBotaoGoogle(): void {
        if (!this.isBrowser || !this.googleIniciado() || this.googleButtonRendered) return;

        const element = this.googleButtonLoginRef?.nativeElement || this.googleButtonCadastroRef?.nativeElement;
        if (element) {
            try {
                this.googleSignInService.renderButton(element, {
                    theme: 'outline',
                    size: 'large',
                    text: 'continue_with',
                    shape: 'rectangular',
                    width: 300
                });
                this.googleButtonRendered = true;
            } catch (e) {
                console.error('Erro ao renderizar botão Google:', e);
            }
        }
    }

    private async processarLoginGoogle(idToken: string): Promise<void> {
        this.loginCarregando.set(true);
        this.erro.set(null);

        try {
            const response = await firstValueFrom(this.clienteAuthService.loginGoogle(idToken));
            this.cliente.set(response.cliente);

            // Se cliente Google não tem endereço, ir para cadastro de endereço
            if (!response.cliente.temEndereco) {
                this.etapaCadastro.set('endereco');
                this.etapaAtual.set('cadastro');
            } else {
                if (response.cliente.enderecoFormatado) {
                    this.enderecoEntrega.set(response.cliente.enderecoFormatado);
                }
                this.etapaAtual.set('cardapio');
            }
        } catch (e: any) {
            console.error('Erro no login com Google:', e);
            this.erro.set(e?.error?.message || 'Erro ao fazer login com Google');
        } finally {
            this.loginCarregando.set(false);
        }
    }

    // ========== LOGIN ==========

    formatarTelefone(valor: string): string {
        const numeros = valor.replace(/\D/g, '');
        if (numeros.length <= 2) return numeros;
        if (numeros.length <= 7) return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
        if (numeros.length <= 11) return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
        return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7, 11)}`;
    }

    onLoginTelefoneChange(event: Event): void {
        const input = event.target as HTMLInputElement;
        const formatted = this.formatarTelefone(input.value);
        this.loginTelefone.set(formatted);
    }

    async fazerLogin(): Promise<void> {
        if (!this.loginValido()) return;

        this.loginCarregando.set(true);
        this.erro.set(null);

        const request: ClienteLoginRequest = {
            telefone: this.loginTelefone().replace(/\D/g, ''),
            senha: this.loginSenha()
        };

        try {
            const response = await firstValueFrom(this.clienteAuthService.login(request));
            this.cliente.set(response.cliente);
            if (response.cliente.enderecoFormatado) {
                this.enderecoEntrega.set(response.cliente.enderecoFormatado);
            }
            this.etapaAtual.set('cardapio');
        } catch (e: any) {
            console.error('Erro no login:', e);
            this.erro.set(e?.error?.message || 'Telefone ou senha incorretos');
        } finally {
            this.loginCarregando.set(false);
        }
    }

    // ========== CADASTRO ==========

    onCadastroTelefoneChange(event: Event): void {
        const input = event.target as HTMLInputElement;
        const formatted = this.formatarTelefone(input.value);
        this.atualizarFormCadastro('telefone', formatted);
    }

    formatarCep(valor: string): string {
        const numeros = valor.replace(/\D/g, '');
        if (numeros.length <= 5) return numeros;
        return `${numeros.slice(0, 5)}-${numeros.slice(5, 8)}`;
    }

    onCepChange(event: Event): void {
        const input = event.target as HTMLInputElement;
        const formatted = this.formatarCep(input.value);
        this.atualizarFormCadastro('cep', formatted);

        // Buscar CEP quando tiver 8 dígitos
        const cep = formatted.replace(/\D/g, '');
        if (cep.length === 8) {
            this.buscarCep(cep);
        }
    }

    private async buscarCep(cep: string): Promise<void> {
        this.buscandoCep.set(true);
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await response.json();
            if (!data.erro) {
                this.atualizarFormCadastro('logradouro', data.logradouro || '');
                this.atualizarFormCadastro('bairro', data.bairro || '');
                this.atualizarFormCadastro('cidade', data.localidade || '');
                this.atualizarFormCadastro('estado', data.uf || '');
            }
        } catch (e) {
            console.error('Erro ao buscar CEP:', e);
        } finally {
            this.buscandoCep.set(false);
        }
    }

    atualizarFormCadastro<K extends keyof FormCadastro>(campo: K, valor: FormCadastro[K]): void {
        this.formCadastro.update(form => ({ ...form, [campo]: valor }));
    }

    avancarParaEndereco(): void {
        if (this.dadosCadastroValidos()) {
            this.etapaCadastro.set('endereco');
        }
    }

    voltarParaDados(): void {
        this.etapaCadastro.set('dados');
    }

    async finalizarCadastro(): Promise<void> {
        if (!this.enderecoCadastroValido()) return;

        this.cadastroCarregando.set(true);
        this.erro.set(null);

        const form = this.formCadastro();
        const request: CadastrarClienteDeliveryRequest = {
            nome: form.nome.trim(),
            telefone: form.telefone.replace(/\D/g, ''),
            email: form.email.trim() || undefined,
            senha: form.senha,
            logradouro: form.logradouro.trim(),
            numero: form.numero.trim(),
            complemento: form.complemento.trim() || undefined,
            bairro: form.bairro.trim(),
            cidade: form.cidade.trim(),
            estado: form.estado.toUpperCase(),
            cep: form.cep.replace(/\D/g, ''),
            pontoReferencia: form.pontoReferencia.trim() || undefined
        };

        try {
            const response = await firstValueFrom(this.clienteAuthService.cadastrarDelivery(request));
            this.cliente.set(response.cliente);
            if (response.cliente.enderecoFormatado) {
                this.enderecoEntrega.set(response.cliente.enderecoFormatado);
            }
            this.etapaAtual.set('cardapio');
        } catch (e: any) {
            console.error('Erro no cadastro:', e);
            this.erro.set(e?.error?.message || 'Erro ao cadastrar. Tente novamente.');
        } finally {
            this.cadastroCarregando.set(false);
        }
    }

    // ========== NAVEGAÇÃO ==========

    irParaLogin(): void {
        this.erro.set(null);
        this.googleButtonRendered = false;
        this.etapaAtual.set('login');
    }

    irParaCadastro(): void {
        this.erro.set(null);
        this.googleButtonRendered = false;
        this.etapaCadastro.set('dados');
        this.etapaAtual.set('cadastro');
    }

    irParaBoasVindas(): void {
        this.erro.set(null);
        this.googleButtonRendered = false;
        this.etapaAtual.set('boas-vindas');
    }

    logout(): void {
        this.clienteAuthService.logout();
        this.cliente.set(null);
        this.itensCarrinho.set([]);
        this.etapaAtual.set('boas-vindas');
    }

    // ========== CARDÁPIO ==========

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

    // ========== PRODUTO/CARRINHO ==========

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

    toggleAdicional(adicional: Adicional): void {
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

    formatarAdicionaisItem(item: ItemCarrinho): string {
        if (!item.adicionais || item.adicionais.length === 0) {
            return '';
        }
        return item.adicionais.map(a => a.adicional.nome).join(', ');
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

        const itens = this.itensCarrinho();
        const itemExistente = itens.find(
            i => i.produto.id === produto.id &&
                i.observacao === novoItem.observacao &&
                JSON.stringify(i.adicionais) === JSON.stringify(novoItem.adicionais)
        );

        if (itemExistente) {
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

    incrementarItemCarrinho(index: number): void {
        const itens = this.itensCarrinho();
        this.itensCarrinho.set(
            itens.map((item, i) =>
                i === index ? { ...item, quantidade: item.quantidade + 1 } : item
            )
        );
    }

    decrementarItemCarrinho(index: number): void {
        const itens = this.itensCarrinho();
        const item = itens[index];
        if (item.quantidade <= 1) {
            this.removerDoCarrinho(index);
        } else {
            this.itensCarrinho.set(
                itens.map((it, i) =>
                    i === index ? { ...it, quantidade: it.quantidade - 1 } : it
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

    // ========== CHECKOUT ==========

    irParaCheckout(): void {
        if (this.carrinhoVazio()) return;
        this.mostrarCarrinho.set(false);
        this.etapaAtual.set('checkout');
    }

    voltarParaCardapio(): void {
        this.etapaAtual.set('cardapio');
    }

    selecionarMeioPagamento(meio: MeioPagamento): void {
        this.meioPagamentoSelecionado.set(meio);
    }

    async enviarPedido(): Promise<void> {
        if (!this.podeEnviarPedido() || !this.cliente()) return;

        this.enviando.set(true);
        this.erro.set(null);

        const clienteData = this.cliente()!;
        const itens: ItemPedidoDeliveryRequest[] = this.itensCarrinho().map(item => ({
            produtoId: item.produto.id,
            quantidade: item.quantidade,
            observacoes: item.observacao,
            adicionais: item.adicionais?.map(a => ({
                adicionalId: a.adicional.id,
                nomeAdicional: a.adicional.nome,
                quantidade: a.quantidade,
                precoUnitario: a.adicional.preco
            }))
        }));

        const request: CriarPedidoDeliveryRequest = {
            clienteId: clienteData.id,
            nomeCliente: clienteData.nome,
            telefoneCliente: clienteData.telefone || '',
            emailCliente: clienteData.email,
            itens,
            meiosPagamento: [{
                meioPagamento: this.meioPagamentoSelecionado()!,
                valor: this.totalCarrinho()
            }],
            tipoPedido: this.tipoPedido(),
            enderecoEntrega: this.tipoPedido() === 'DELIVERY' ? this.enderecoEntrega() : undefined,
            logradouro: clienteData.logradouro,
            numero: clienteData.numero,
            complemento: clienteData.complemento,
            bairro: clienteData.bairro,
            cidade: clienteData.cidade,
            estado: clienteData.estado,
            cep: clienteData.cep,
            pontoReferencia: clienteData.pontoReferencia,
            meioPagamento: this.meioPagamentoSelecionado() ?? undefined
        };

        try {
            const response = await firstValueFrom(this.deliveryService.criarPedido(request));
            this.pedidoId.set(response.id);
            this.itensCarrinho.set([]);
            this.etapaAtual.set('sucesso');
            this.iniciarPollingStatus(response.id);
        } catch (e: any) {
            console.error('Erro ao enviar pedido:', e);
            this.erro.set(e?.error?.message || 'Erro ao enviar pedido. Tente novamente.');
        } finally {
            this.enviando.set(false);
        }
    }

    // ========== SUCESSO/STATUS ==========

    private iniciarPollingStatus(pedidoId: string): void {
        interval(10000)
            .pipe(
                takeUntil(this.destroy$),
                switchMap(() => this.deliveryService.buscarStatusPedido(pedidoId)),
                catchError(() => of(null))
            )
            .subscribe(status => {
                if (status) {
                    this.statusPedido.set(status);
                }
            });
    }

    novoPedido(): void {
        this.pedidoId.set(null);
        this.statusPedido.set(null);
        this.meioPagamentoSelecionado.set(null);
        this.etapaAtual.set('cardapio');
    }

    // ========== HELPERS PARA TEMPLATE ==========

    getStatusDescricao(status: string): string {
        const descricoes: Record<string, string> = {
            'AGUARDANDO_ACEITACAO': 'Aguardando confirmação',
            'ACEITO': 'Pedido aceito',
            'PREPARANDO': 'Preparando seu pedido',
            'PRONTO': 'Pedido pronto',
            'SAIU_PARA_ENTREGA': 'Saiu para entrega',
            'ENTREGUE': 'Entregue',
            'FINALIZADO': 'Finalizado',
            'CANCELADO': 'Cancelado'
        };
        return descricoes[status] || status;
    }

    getStatusIcon(status: string): string {
        const icons: Record<string, string> = {
            'AGUARDANDO_ACEITACAO': '⏳',
            'ACEITO': '✅',
            'PREPARANDO': '👨‍🍳',
            'PRONTO': '🍽️',
            'SAIU_PARA_ENTREGA': '🛵',
            'ENTREGUE': '📦',
            'FINALIZADO': '🎉',
            'CANCELADO': '❌'
        };
        return icons[status] || '📋';
    }
}
